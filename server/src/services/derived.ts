import { FinePayments, Loans, Requests } from "../models"
import type { Book, BookRequest, FinePayment, Loan, Settings, User } from "../types"
import { booksMap, DAY, iso, must, usersMap } from "./lookups"

/* Derived state, computed on every read. Ported from the mock in src/services/api.ts. */

export function daysOverdue(loan: Loan, now = Date.now()): number {
  if (loan.status !== "active") return 0
  return Math.max(0, Math.floor((now - new Date(loan.dueDate).getTime()) / DAY))
}

/** Active loans whose fine is above zero have a due date at least a day ago. */
export const overdueFilter = () => ({
  status: "active",
  dueDate: { $lte: iso(Date.now() - DAY) },
})

async function paidByLoan(loanIds: string[]): Promise<Map<string, number>> {
  if (!loanIds.length) return new Map()
  const rows = await FinePayments.aggregate<{ _id: string; total: number }>([
    { $match: { loanId: { $in: loanIds } } },
    { $group: { _id: "$loanId", total: { $sum: "$amount" } } },
  ])
  return new Map(rows.map((row) => [row._id, row.total]))
}

/** Fine still owed per loan: days overdue × finePerDay, minus settlements. Never stored. */
export async function fineBalances(
  loans: Loan[],
  s: Settings,
): Promise<Map<string, number>> {
  const paid = await paidByLoan(
    loans.filter((loan) => loan.status === "active").map((loan) => loan._id),
  )
  return new Map(
    loans.map((loan) => [
      loan._id,
      Math.max(0, daysOverdue(loan) * s.finePerDay - (paid.get(loan._id) ?? 0)),
    ]),
  )
}

export const activeLoans = (userId: string) =>
  Loans.find({ userId, status: "active" }).sort({ _id: 1 }).lean<Loan[]>()

export interface MemberTotals {
  loans: number
  holds: number
  fines: number
}

/** Active loans, active holds and outstanding fines for many members at once. */
export async function memberTotals(
  userIds: string[],
  s: Settings,
): Promise<Map<string, MemberTotals>> {
  const [loans, holds] = await Promise.all([
    Loans.find({ userId: { $in: userIds }, status: "active" }).lean<Loan[]>(),
    Requests.aggregate<{ _id: string; n: number }>([
      { $match: { userId: { $in: userIds }, status: "approved" } },
      { $group: { _id: "$userId", n: { $sum: 1 } } },
    ]),
  ])
  const balances = await fineBalances(loans, s)
  const totals = new Map<string, MemberTotals>(
    userIds.map((id) => [id, { loans: 0, holds: 0, fines: 0 }]),
  )
  for (const loan of loans) {
    const t = totals.get(loan.userId)!
    t.loans += 1
    t.fines += balances.get(loan._id) ?? 0
  }
  for (const hold of holds) totals.get(hold._id)!.holds = hold.n
  return totals
}

export async function memberTotal(userId: string, s: Settings) {
  return (await memberTotals([userId], s)).get(userId)!
}

/** Reasons that stop a member from requesting at all. */
export function blockReason(user: User, t: MemberTotals, s: Settings): string | null {
  if (user.status === "suspended")
    return "Your account is suspended. Please contact the library desk."
  if (t.fines >= s.fineBlockThreshold)
    return `Outstanding fines of ₹${t.fines} are above the ₹${s.fineBlockThreshold} limit. Clear them at the desk to borrow again.`
  return null
}

export interface Eligibility {
  booksOut: number
  limit: number
  fines: number
  threshold: number
  status: User["status"]
  checks: { books: boolean; fines: boolean; account: boolean }
  eligible: boolean
}

export function eligibilityFor(user: User, t: MemberTotals, s: Settings): Eligibility {
  const booksOut = t.loans + t.holds
  const checks = {
    books: booksOut < s.maxBooksPerUser,
    fines: t.fines < s.fineBlockThreshold,
    account: user.status === "active",
  }
  return {
    booksOut,
    limit: s.maxBooksPerUser,
    fines: t.fines,
    threshold: s.fineBlockThreshold,
    status: user.status,
    checks,
    eligible: checks.books && checks.fines && checks.account,
  }
}

export type BookAction =
  | { kind: "available" }
  | { kind: "waitlist" }
  | { kind: "requested"; status: "pending" | "approved"; holdExpiresAt: string | null }
  | { kind: "borrowed"; dueDate: string }
  | { kind: "blocked"; reason: string }

export async function actionFor(user: User, book: Book, s: Settings): Promise<BookAction> {
  const [loan, request] = await Promise.all([
    Loans.findOne({ userId: user._id, bookId: book._id, status: "active" }).lean<Loan>(),
    Requests.findOne({
      userId: user._id,
      bookId: book._id,
      status: { $in: ["pending", "approved"] },
    }).lean<BookRequest>(),
  ])
  if (loan) return { kind: "borrowed", dueDate: loan.dueDate }
  if (request)
    return {
      kind: "requested",
      status: request.status as "pending" | "approved",
      holdExpiresAt: request.holdExpiresAt,
    }
  const reason = blockReason(user, await memberTotal(user._id, s), s)
  if (reason) return { kind: "blocked", reason }
  return book.availableCopies > 0 ? { kind: "available" } : { kind: "waitlist" }
}

export function renewBlockedReason(
  loan: Loan,
  s: Settings,
  booksWithPendingRequests: Set<string>,
): string | null {
  if (loan.renewCount >= s.maxRenewals) return `Already renewed ${s.maxRenewals} times`
  if (booksWithPendingRequests.has(loan.bookId))
    return "Another member is waiting for this book"
  return null
}

export async function booksWithPendingRequests(bookIds: string[]): Promise<Set<string>> {
  const ids: string[] = await Requests.distinct("bookId", {
    status: "pending",
    bookId: { $in: bookIds },
  })
  return new Set(ids)
}

export interface LoanView extends Loan {
  book: Book
  daysOverdue: number
  fine: number
  dueSoon: boolean
  renewBlockedReason: string | null
}

export async function loanViews(loans: Loan[], s: Settings): Promise<LoanView[]> {
  const bookIds = loans.map((loan) => loan.bookId)
  const [books, fines, waiting] = await Promise.all([
    booksMap(bookIds),
    fineBalances(loans, s),
    booksWithPendingRequests(bookIds),
  ])
  const now = Date.now()
  return loans.map((loan) => {
    const msLeft = new Date(loan.dueDate).getTime() - now
    return {
      ...loan,
      book: must(books, loan.bookId),
      daysOverdue: daysOverdue(loan, now),
      fine: fines.get(loan._id) ?? 0,
      dueSoon: loan.status === "active" && msLeft >= 0 && msLeft <= 2 * DAY,
      renewBlockedReason: renewBlockedReason(loan, s, waiting),
    }
  })
}

export async function loanView(loan: Loan, s: Settings): Promise<LoanView> {
  return (await loanViews([loan], s))[0]
}

/** Rewrites a member-facing flag ("You already have…") for the librarian queue. */
export function librarianFlagReason(
  request: BookRequest,
  user: User,
  book: Book,
  t: MemberTotals,
  s: Settings,
): string | null {
  if (!request.flagReason) return null
  const first = user.name.split(" ")[0]
  const reasons: string[] = []
  const raw = request.flagReason.toLowerCase()
  if (raw.includes("no cop") || book.availableCopies === 0) reasons.push("No copy is free")
  if (raw.includes("already have"))
    reasons.push(
      `${first} already has ${t.loans + t.holds} of ${s.maxBooksPerUser} books out or on hold`,
    )
  if (raw.includes("fine")) reasons.push(`${first} has ₹${t.fines} in unpaid fines`)
  if (!reasons.length)
    return request.flagReason
      .replace(/\byou\b/gi, first)
      .replace(/\byour\b/gi, `${first}'s`)
  return reasons.join(". ")
}

export interface FineItem {
  _id: string
  loan: Loan
  user: User
  book: Book
  amount: number
  status: "outstanding" | "collected" | "waived"
  date: string
  reason: string | null
}

/** Outstanding fines (computed) plus settlements, newest first. All members when userId is omitted. */
export async function fineItems(s: Settings, userId?: string): Promise<FineItem[]> {
  const scope = userId ? { userId } : {}
  const overdue = await Loans.find({ ...scope, ...overdueFilter() }).lean<Loan[]>()
  const balances = await fineBalances(overdue, s)
  const payments = await FinePayments.find(
    userId ? { loanId: { $in: await Loans.distinct("_id", { userId }) } } : {},
  ).lean<FinePayment[]>()
  const paidLoans = await Loans.find({
    _id: { $in: payments.map((p) => p.loanId) },
  }).lean<Loan[]>()
  const loans = new Map([...overdue, ...paidLoans].map((loan) => [loan._id, loan]))
  const [users, books] = await Promise.all([
    usersMap([...loans.values()].map((loan) => loan.userId)),
    booksMap([...loans.values()].map((loan) => loan.bookId)),
  ])

  const outstanding = overdue
    .filter((loan) => balances.get(loan._id)! > 0)
    .map(
      (loan): FineItem => ({
        _id: `due-${loan._id}`,
        loan,
        user: must(users, loan.userId),
        book: must(books, loan.bookId),
        amount: balances.get(loan._id)!,
        status: "outstanding",
        date: loan.dueDate,
        reason: null,
      }),
    )
  const settled = payments.map((payment): FineItem => {
    const loan = must(loans, payment.loanId)
    return {
      _id: payment._id,
      loan,
      user: must(users, loan.userId),
      book: must(books, loan.bookId),
      amount: payment.amount,
      status: payment.action,
      date: payment.at,
      reason: payment.reason,
    }
  })
  return [...outstanding, ...settled].sort((a, b) => b.date.localeCompare(a.date))
}
