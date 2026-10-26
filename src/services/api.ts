import { activity } from "@/data/activity"
import { books } from "@/data/books"
import { copies } from "@/data/copies"
import { finePayments } from "@/data/finePayments"
import { loans } from "@/data/loans"
import { reminders } from "@/data/reminders"
import { requests } from "@/data/requests"
import { savedBooks } from "@/data/savedBooks"
import { settings } from "@/data/settings"
import { users } from "@/data/users"
import type {
  ActivityEvent,
  ActivityType,
  Book,
  BookRequest,
  Copy,
  CopyStatus,
  FinePayment,
  Loan,
  Settings,
  User,
} from "@/types"

const DAY = 24 * 60 * 60 * 1000
const LATENCY = 300

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(value)), LATENCY),
  )

const fail = (message: string): Promise<never> =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), LATENCY),
  )

const newId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/* ---------- Derived state, computed on every read ---------- */

/** Holds past holdExpiresAt become expired and release their copy. */
function sweepExpiredHolds() {
  const now = Date.now()
  for (const r of requests) {
    if (
      r.status === "approved" &&
      r.holdExpiresAt &&
      new Date(r.holdExpiresAt).getTime() < now
    ) {
      r.status = "expired"
      const copy = copies.find((c) => c._id === r.copyId)
      if (copy?.status === "on_hold") copy.status = "available"
    }
  }
}

function withAvailability(book: Book): Book {
  const own = copies.filter(
    (c) => c.bookId === book._id && c.status !== "retired",
  )
  return {
    ...book,
    totalCopies: own.length,
    availableCopies: own.filter((c) => c.status === "available").length,
  }
}

function daysOverdue(loan: Loan): number {
  if (loan.status !== "active") return 0
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(loan.dueDate).getTime()) / DAY),
  )
}

const fineFor = (loan: Loan) => daysOverdue(loan) * settings.finePerDay

const activeLoans = (userId: string) =>
  loans.filter((l) => l.userId === userId && l.status === "active")
const activeHolds = (userId: string) =>
  requests.filter((r) => r.userId === userId && r.status === "approved")
const outstandingFines = (userId: string) =>
  activeLoans(userId).reduce((sum, l) => sum + fineBalance(l), 0)
const fineBalance = (loan: Loan) =>
  Math.max(
    0,
    fineFor(loan) -
      finePayments
        .filter((payment) => payment.loanId === loan._id)
        .reduce((sum, payment) => sum + payment.amount, 0),
  )
const bookById = (id: string) =>
  withAvailability(books.find((b) => b._id === id)!)

/** Reasons that stop a member from requesting at all. */
function blockReason(user: User): string | null {
  if (user.status === "suspended")
    return "Your account is suspended. Please contact the library desk."
  const fines = outstandingFines(user._id)
  if (fines >= settings.fineBlockThreshold)
    return `Outstanding fines of ₹${fines} are above the ₹${settings.fineBlockThreshold} limit. Clear them at the desk to borrow again.`
  return null
}

/* ---------- Auth ---------- */

export async function login(email: string): Promise<User> {
  const normalised = email.trim().toLowerCase()
  let user = users.find((u) => u.email === normalised)
  if (!user) {
    const local = normalised.split("@")[0].replace(/[._-]+/g, " ")
    user = {
      _id: newId("u"),
      name: local.replace(/\b\w/g, (c) => c.toUpperCase()),
      email: normalised,
      usn: null,
      role: normalised.includes("admin") ? "admin" : "student",
      status: "active",
      joinedAt: new Date().toISOString(),
    }
    users.push(user)
  }
  return delay(user)
}

export async function signup(input: {
  name: string
  email: string
  usn: string
}): Promise<User> {
  const email = input.email.trim().toLowerCase()
  if (users.some((u) => u.email === email))
    return fail("An account with this email already exists. Sign in instead.")
  const user: User = {
    _id: newId("u"),
    name: input.name.trim(),
    email,
    usn: input.usn.trim().toUpperCase(),
    role: "student",
    status: "active",
    joinedAt: new Date().toISOString(),
  }
  users.push(user)
  return delay(user)
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!email.trim()) return fail("Enter your college email.")
  return delay(undefined)
}

export async function getUser(userId: string): Promise<User | null> {
  return delay(users.find((u) => u._id === userId) ?? null)
}

export async function getSettings(): Promise<Settings> {
  return delay(settings)
}

/* ---------- Catalogue ---------- */

export interface GenreSummary {
  name: string
  count: number
}

export const GENRES = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Mathematics",
  "Fiction",
  "Competitive Exams",
  "Reference",
]

export async function getGenres(): Promise<GenreSummary[]> {
  return delay(
    GENRES.map((name) => ({
      name,
      count: books.filter((b) => b.genres.includes(name)).length,
    })),
  )
}

export async function getLanguages(): Promise<string[]> {
  return delay([...new Set(books.map((b) => b.language))].sort())
}

export async function getNewArrivals(limit = 10): Promise<Book[]> {
  sweepExpiredHolds()
  return delay(
    books
      .filter((book) => !book.archived)
      .sort((a, b) => b.year - a.year)
      .slice(0, limit)
      .map(withAvailability),
  )
}

export async function getMostBorrowed(limit = 10): Promise<Book[]> {
  sweepExpiredHolds()
  const since = Date.now() - 30 * DAY
  const counts = new Map<string, number>()
  for (const l of loans)
    if (new Date(l.issuedAt).getTime() >= since)
      counts.set(l.bookId, (counts.get(l.bookId) ?? 0) + 1)
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => bookById(id))
    .filter((book) => !book.archived)
  return delay(ranked.slice(0, limit))
}

export type SortKey = "relevance" | "title" | "newest" | "available"

export interface SearchParams {
  q?: string
  genres?: string[]
  language?: string
  availableOnly?: boolean
  sort?: SortKey
}

export async function searchBooks(params: SearchParams): Promise<Book[]> {
  sweepExpiredHolds()
  const q = params.q?.trim().toLowerCase() ?? ""
  const score = (b: Book) => {
    if (!q) return 1
    if (b.title.toLowerCase().includes(q)) return 3
    if (b.authors.some((a) => a.toLowerCase().includes(q))) return 2
    if (
      b.isbn.replace(/-/g, "").includes(q.replace(/-/g, "")) ||
      b.shelfLocation.toLowerCase() === q
    )
      return 2
    if (
      b.genres.some((g) => g.toLowerCase().includes(q)) ||
      b.publisher.toLowerCase().includes(q)
    )
      return 1
    return 0
  }
  const sort = params.sort ?? "relevance"
  const result = books
    .filter((b) => !b.archived)
    .map((b) => ({ book: withAvailability(b), score: score(b) }))
    .filter(({ book, score }) => {
      if (score === 0) return false
      if (
        params.genres?.length &&
        !book.genres.some((g) => params.genres!.includes(g))
      )
        return false
      if (params.language && book.language !== params.language) return false
      if (params.availableOnly && book.availableCopies === 0) return false
      return true
    })
    .sort((a, b) => {
      if (sort === "title") return a.book.title.localeCompare(b.book.title)
      if (sort === "newest") return b.book.year - a.book.year
      if (sort === "available")
        return b.book.availableCopies - a.book.availableCopies
      return b.score - a.score || a.book.title.localeCompare(b.book.title)
    })
  return delay(result.map((r) => r.book))
}

/* ---------- Book detail ---------- */

export type BookAction = { kind: "available" } | { kind: "waitlist" } | {
  kind: "requested"
  status: "pending" | "approved"
  holdExpiresAt: string | null
} | { kind: "borrowed" dueDate: string } | { kind: "blocked" reason: string }

export interface BookDetail {
  book: Book
  copies: Copy[]
  action: BookAction
  saved: boolean
}

function actionFor(user: User, book: Book): BookAction {
  const loan = activeLoans(user._id).find((l) => l.bookId === book._id)
  if (loan) return { kind: "borrowed", dueDate: loan.dueDate }
  const req = requests.find(
    (r) =>
      r.userId === user._id &&
      r.bookId === book._id &&
      (r.status === "pending" || r.status === "approved"),
  )
  if (req)
    return {
      kind: "requested",
      status: req.status as "pending" | "approved",
      holdExpiresAt: req.holdExpiresAt,
    }
  const reason = blockReason(user)
  if (reason) return { kind: "blocked", reason }
  return book.availableCopies > 0 ? { kind: "available" } : { kind: "waitlist" }
}

export async function getBookDetail(
  userId: string,
  bookId: string,
): Promise<BookDetail | null> {
  sweepExpiredHolds()
  const raw = books.find((b) => b._id === bookId)
  const user = users.find((u) => u._id === userId)
  if (!raw || !user) return delay(null)
  const book = withAvailability(raw)
  return delay({
    book,
    copies: copies.filter((c) => c.bookId === bookId),
    action: actionFor(user, book),
    saved: savedBooks.some((s) => s.userId === userId && s.bookId === bookId),
  })
}

/* ---------- Requests ---------- */

export interface RequestOutcome {
  request: BookRequest
  book: Book
}

export async function requestBook(
  userId: string,
  bookId: string,
): Promise<RequestOutcome> {
  sweepExpiredHolds()
  const user = users.find((u) => u._id === userId)
  const raw = books.find((b) => b._id === bookId)
  if (!user || !raw) return fail("Book or member not found.")
  if (user.status === "suspended")
    return fail("Your account is suspended. Please contact the library desk.")
  const existing = actionFor(user, withAvailability(raw))
  if (existing.kind === "borrowed" || existing.kind === "requested")
    return fail("You already have this book or a request for it.")

  const flags: string[] = []
  const used = activeLoans(userId).length + activeHolds(userId).length
  if (used >= settings.maxBooksPerUser)
    flags.push(
      `You already have ${used} of ${settings.maxBooksPerUser} books out or on hold.`,
    )
  const fines = outstandingFines(userId)
  if (fines >= settings.fineBlockThreshold)
    flags.push(
      `Outstanding fines of ₹${fines} are above the ₹${settings.fineBlockThreshold} limit.`,
    )
  const copy = copies.find(
    (c) => c.bookId === bookId && c.status === "available",
  )
  if (!copy)
    flags.push("No copies are available right now. You are on the waitlist.")
  if (flags.length === 0 && settings.requireManualApproval)
    flags.push("The library is reviewing every request manually right now.")

  const now = new Date()
  const base = {
    _id: newId("r"),
    userId,
    bookId,
    requestedAt: now.toISOString(),
    rejectReason: null,
  }
  let request: BookRequest
  if (flags.length === 0 && copy) {
    copy.status = "on_hold"
    request = {
      ...base,
      copyId: copy._id,
      status: "approved",
      decidedAt: now.toISOString(),
      holdExpiresAt: new Date(
        now.getTime() + settings.holdHours * 60 * 60 * 1000,
      ).toISOString(),
      flagReason: null,
    }
  } else {
    request = {
      ...base,
      copyId: null,
      status: "pending",
      decidedAt: null,
      holdExpiresAt: null,
      flagReason: flags.join(" "),
    }
  }
  requests.push(request)
  return delay({ request, book: bookById(bookId) })
}

export async function cancelRequest(
  userId: string,
  requestId: string,
): Promise<void> {
  const req = requests.find((r) => r._id === requestId && r.userId === userId)
  if (!req || (req.status !== "pending" && req.status !== "approved"))
    return fail("This request can no longer be cancelled.")
  const copy = copies.find((c) => c._id === req.copyId)
  if (copy?.status === "on_hold") copy.status = "available"
  req.status = "expired"
  req.decidedAt = new Date().toISOString()
  req.rejectReason = "Cancelled by you"
  return delay(undefined)
}

/* ---------- Loans ---------- */

export interface LoanView extends Loan {
  book: Book
  daysOverdue: number
  fine: number
  dueSoon: boolean
  renewBlockedReason: string | null
}

function renewBlockedReason(loan: Loan): string | null {
  if (loan.renewCount >= settings.maxRenewals)
    return `Already renewed ${settings.maxRenewals} times`
  if (requests.some((r) => r.bookId === loan.bookId && r.status === "pending"))
    return "Another member is waiting for this book"
  return null
}

function toLoanView(loan: Loan): LoanView {
  const msLeft = new Date(loan.dueDate).getTime() - Date.now()
  return {
    ...loan,
    book: bookById(loan.bookId),
    daysOverdue: daysOverdue(loan),
    fine: fineBalance(loan),
    dueSoon: loan.status === "active" && msLeft >= 0 && msLeft <= 2 * DAY,
    renewBlockedReason: renewBlockedReason(loan),
  }
}

export async function renewLoan(
  userId: string,
  loanId: string,
): Promise<LoanView> {
  const loan = loans.find(
    (l) => l._id === loanId && l.userId === userId && l.status === "active",
  )
  if (!loan) return fail("Loan not found.")
  const reason = renewBlockedReason(loan)
  if (reason) return fail(`This book cannot be renewed. ${reason}.`)
  loan.renewCount += 1
  loan.dueDate = new Date(
    new Date(loan.dueDate).getTime() + settings.loanPeriodDays * DAY,
  ).toISOString()
  return delay(toLoanView(loan))
}

/* ---------- My books ---------- */

export interface RequestView extends BookRequest {
  book: Book
}

export interface HistoryEntry {
  _id: string
  book: Book
  kind: "loan" | "request"
  status: "returned" | "lost" | "rejected" | "expired" | "cancelled"
  date: string
  note: string | null
}

export interface MyBooks {
  active: LoanView[]
  requests: RequestView[]
  history: HistoryEntry[]
  totalFines: number
  limit: number
}

export async function getMyBooks(userId: string): Promise<MyBooks> {
  sweepExpiredHolds()
  const mine = requests.filter((r) => r.userId === userId)
  const loanHistory = loans
    .filter((l) => l.userId === userId && l.status !== "active")
    .map(
      (l): HistoryEntry => ({
        _id: l._id,
        book: bookById(l.bookId),
        kind: "loan",
        status: l.status === "lost" ? "lost" : "returned",
        date: l.returnedAt ?? l.dueDate,
        note: null,
      }),
    )
  const requestHistory = mine
    .filter((r) => r.status === "rejected" || r.status === "expired")
    .map((r): HistoryEntry => {
      const cancelled = r.rejectReason === "Cancelled by you"
      return {
        _id: r._id,
        book: bookById(r.bookId),
        kind: "request",
        status: cancelled
          ? "cancelled"
          : r.status === "rejected"
            ? "rejected"
            : "expired",
        date: r.decidedAt ?? r.holdExpiresAt ?? r.requestedAt,
        note: cancelled
          ? null
          : r.status === "rejected"
            ? r.rejectReason
            : "Hold was not collected in time",
      }
    })

  return delay({
    active: activeLoans(userId)
      .map(toLoanView)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    requests: mine
      .filter((r) => r.status === "pending" || r.status === "approved")
      .map((r) => ({ ...r, book: bookById(r.bookId) }))
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    history: [...loanHistory, ...requestHistory].sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
    totalFines: outstandingFines(userId),
    limit: settings.maxBooksPerUser,
  })
}

export interface Alerts {
  overdue: number
  dueSoon: number
  readyToCollect: number
}

export async function getAlerts(userId: string): Promise<Alerts> {
  sweepExpiredHolds()
  const views = activeLoans(userId).map(toLoanView)
  return delay({
    overdue: views.filter((v) => v.daysOverdue > 0).length,
    dueSoon: views.filter((v) => v.dueSoon).length,
    readyToCollect: activeHolds(userId).length,
  })
}

/* ---------- Saved ---------- */

export async function getSavedBooks(userId: string): Promise<Book[]> {
  sweepExpiredHolds()
  return delay(
    savedBooks
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .map((s) => bookById(s.bookId)),
  )
}

export async function toggleSaved(
  userId: string,
  bookId: string,
): Promise<boolean> {
  const index = savedBooks.findIndex(
    (s) => s.userId === userId && s.bookId === bookId,
  )
  if (index >= 0) {
    savedBooks.splice(index, 1)
    return delay(false)
  }
  savedBooks.push({
    _id: newId("s"),
    userId,
    bookId,
    savedAt: new Date().toISOString(),
  })
  return delay(true)
}

/* ---------- Profile ---------- */

export interface ProfileSummary {
  user: User
  activeCount: number
  holdCount: number
  totalBorrowed: number
  totalFines: number
  settings: Settings
}

export async function getProfile(
  userId: string,
): Promise<ProfileSummary | null> {
  sweepExpiredHolds()
  const user = users.find((u) => u._id === userId)
  if (!user) return delay(null)
  return delay({
    user,
    activeCount: activeLoans(userId).length,
    holdCount: activeHolds(userId).length,
    totalBorrowed: loans.filter((l) => l.userId === userId).length,
    totalFines: outstandingFines(userId),
    settings,
  })
}

export async function updateProfile(
  userId: string,
  input: { name: string email: string },
): Promise<User> {
  const user = users.find((item) => item._id === userId)
  if (!user) return fail("Member not found.")
  user.name = input.name.trim()
  user.email = input.email.trim().toLowerCase()
  return delay(user)
}

export interface LoanDetail {
  loan: LoanView
  copy: Copy
  requestedAt: string | null
  collectedAt: string
}

export async function getLoanDetail(
  userId: string,
  loanId: string,
): Promise<LoanDetail | null> {
  const loan = loans.find(
    (item) => item._id === loanId && item.userId === userId,
  )
  if (!loan) return delay(null)
  const request = requests
    .filter((item) => item.userId === userId && item.bookId === loan.bookId)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0]
  return delay({
    loan: toLoanView(loan),
    copy: copyById(loan.copyId)!,
    requestedAt: request?.requestedAt ?? null,
    collectedAt: loan.issuedAt,
  })
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

function allFineItems(): FineItem[] {
  const outstanding = loans
    .filter((loan) => loan.status === "active" && fineBalance(loan) > 0)
    .map(
      (loan): FineItem => ({
        _id: `due-${loan._id}`,
        loan,
        user: userById(loan.userId),
        book: bookById(loan.bookId),
        amount: fineBalance(loan),
        status: "outstanding",
        date: loan.dueDate,
        reason: null,
      }),
    )
  const settled = finePayments.map((payment): FineItem => {
    const loan = loans.find((item) => item._id === payment.loanId)!
    return {
      _id: payment._id,
      loan,
      user: userById(loan.userId),
      book: bookById(loan.bookId),
      amount: payment.amount,
      status: payment.action,
      date: payment.at,
      reason: payment.reason,
    }
  })
  return [...outstanding, ...settled].sort((a, b) =>
    b.date.localeCompare(a.date),
  )
}

export async function getMyFines(
  userId: string,
): Promise<{
  balance: number
  items: FineItem[]
  settings: Settings
}> {
  return delay({
    balance: outstandingFines(userId),
    items: allFineItems().filter((item) => item.user._id === userId),
    settings,
  })
}

export interface MemberNotification {
  _id: string
  title: string
  description: string
  at: string
  to: string
  read: boolean
}

const readNotifications = new Set<string>()

export async function getNotifications(
  userId: string,
): Promise<MemberNotification[]> {
  const loanNotices = activeLoans(userId).map((loan) => {
    const overdue = daysOverdue(loan)
    const book = bookById(loan.bookId)
    return {
      _id: `loan-${loan._id}-${overdue ? "overdue" : "due"}`,
      title: overdue ? "Book overdue" : "Due date reminder",
      description: overdue
        ? `${book.title} is ${overdue} ${
            overdue === 1 ? "day" : "days"
          } overdue.`
        : `${book.title} is due ${new Date(loan.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`,
      at: overdue ? new Date().toISOString() : loan.dueDate,
      to: `/loans/${loan._id}`,
      read: readNotifications.has(
        `loan-${loan._id}-${overdue ? "overdue" : "due"}`,
      ),
    }
  })
  const holdNotices = activeHolds(userId).map((request) => {
    const id = `hold-${request._id}`
    return {
      _id: id,
      title: "Ready for collection",
      description: `${bookById(request.bookId).title} is waiting at the circulation desk.`,
      at: request.decidedAt ?? request.requestedAt,
      to: `/books/${request.bookId}`,
      read: readNotifications.has(id),
    }
  })
  return delay(
    [...loanNotices, ...holdNotices].sort((a, b) => b.at.localeCompare(a.at)),
  )
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const notifications = await getNotifications(userId)
  notifications.forEach((item) => readNotifications.add(item._id))
  return delay(undefined)
}

/* =====================================================================
 * Librarian
 * ===================================================================== */

export type ReturnCondition = "good" | "fair" | "poor" | "damaged"

const userById = (id: string) => users.find((u) => u._id === id)!
const isToday = (iso: string | null) =>
  Boolean(iso) && new Date(iso!).toDateString() === new Date().toDateString()
const copyById = (id: string | null) => copies.find((c) => c._id === id)

function logActivity(
  type: ActivityType,
  userId: string,
  bookId: string,
  note: string | null = null,
) {
  activity.unshift({
    _id: newId("a"),
    type,
    userId,
    bookId,
    at: new Date().toISOString(),
    note,
  })
}

function startLoan(userId: string, copy: Copy): Loan {
  const now = new Date()
  copy.status = "borrowed"
  const loan: Loan = {
    _id: newId("l"),
    userId,
    bookId: copy.bookId,
    copyId: copy._id,
    issuedAt: now.toISOString(),
    dueDate: new Date(
      now.getTime() + settings.loanPeriodDays * DAY,
    ).toISOString(),
    returnedAt: null,
    renewCount: 0,
    status: "active",
  }
  loans.push(loan)
  return loan
}

/** Due date for a loan issued right now. */
export const dueDateIfIssuedNow = () =>
  new Date(Date.now() + settings.loanPeriodDays * DAY).toISOString()

export interface AdminStats {
  activeLoans: number
  overdue: number
  pendingRequests: number
  dueToday: number
}

export async function getAdminStats(): Promise<AdminStats> {
  sweepExpiredHolds()
  const active = loans.filter((l) => l.status === "active")
  return delay({
    activeLoans: active.length,
    overdue: active.filter((l) => daysOverdue(l) > 0).length,
    pendingRequests: requests.filter((r) => r.status === "pending").length,
    dueToday: active.filter((l) => isToday(l.dueDate)).length,
  })
}

/* ---------- Requests queue ---------- */

export type QueueTab = "pending" | "approved" | "rejected"

export interface AdminRequestView {
  request: BookRequest
  user: User
  book: Book
  copy: Copy | null
  flagReason: string | null
}

function librarianFlagReason(
  request: BookRequest,
  user: User,
  book: Book,
): string | null {
  if (!request.flagReason) return null
  const first = user.name.split(" ")[0]
  const reasons: string[] = []
  const raw = request.flagReason.toLowerCase()
  if (raw.includes("no cop") || book.availableCopies === 0)
    reasons.push("No copy is free")
  if (raw.includes("already have")) {
    const used = activeLoans(user._id).length + activeHolds(user._id).length
    reasons.push(
      `${first} already has ${used} of ${settings.maxBooksPerUser} books out or on hold`,
    )
  }
  if (raw.includes("fine")) {
    const amount = outstandingFines(user._id)
    reasons.push(`${first} has ₹${amount} in unpaid fines`)
  }
  if (!reasons.length)
    return request.flagReason
      .replace(/\byou\b/gi, first)
      .replace(/\byour\b/gi, `${first}'s`)
  return reasons.join(". ")
}

export async function getRequestCounts(): Promise<Record<QueueTab, number>> {
  sweepExpiredHolds()
  return delay({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  })
}

export async function listRequests(
  status: QueueTab,
  limit?: number,
): Promise<AdminRequestView[]> {
  sweepExpiredHolds()
  const rows = requests
    .filter((r) => r.status === status)
    .sort((a, b) =>
      status === "pending"
        ? a.requestedAt.localeCompare(b.requestedAt)
        : (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""),
    )
    .slice(0, limit)
    .map((r) => {
      const user = userById(r.userId)
      const book = bookById(r.bookId)
      return {
        request: r,
        user,
        book,
        copy: copyById(r.copyId) ?? null,
        flagReason: librarianFlagReason(r, user, book),
      }
    })
  return delay(rows)
}

export async function approveRequest(
  requestId: string,
): Promise<AdminRequestView> {
  sweepExpiredHolds()
  const req = requests.find((r) => r._id === requestId)
  if (!req || req.status !== "pending")
    return fail("This request has already been decided.")
  const copy = copies.find(
    (c) => c.bookId === req.bookId && c.status === "available",
  )
  if (!copy) return fail("No copy of this book is free to hold.")
  const now = new Date()
  copy.status = "on_hold"
  req.copyId = copy._id
  req.status = "approved"
  req.decidedAt = now.toISOString()
  req.holdExpiresAt = new Date(
    now.getTime() + settings.holdHours * 60 * 60 * 1000,
  ).toISOString()
  logActivity("approved", req.userId, req.bookId)
  return delay({
    request: req,
    user: userById(req.userId),
    book: bookById(req.bookId),
    copy,
    flagReason: null,
  })
}

export async function rejectRequest(
  requestId: string,
  reason: string,
): Promise<void> {
  const req = requests.find((r) => r._id === requestId)
  if (!req || req.status !== "pending")
    return fail("This request has already been decided.")
  if (!reason.trim()) return fail("A reason is required.")
  req.status = "rejected"
  req.decidedAt = new Date().toISOString()
  req.rejectReason = reason.trim()
  logActivity("rejected", req.userId, req.bookId, reason.trim())
  return delay(undefined)
}

/* ---------- Collect hold ---------- */

export interface HoldMatch {
  request: BookRequest
  user: User
  book: Book
  copy: Copy
}

export type HoldLookup = { kind: "found" holds: HoldMatch[] } | {
  kind: "expired"
  hold: HoldMatch
} | { kind: "not_found" user: User | null }

export async function findHold(code: string): Promise<HoldLookup> {
  sweepExpiredHolds()
  const c = code.trim().toUpperCase()
  const copy = copies.find((x) => x.barcode === c)
  const user = users.find((u) => u.usn === c) ?? null
  if (!copy && !user) return delay({ kind: "not_found", user: null })
  const matches = requests.filter(
    (r) => (copy ? r.copyId === copy._id : r.userId === user!._id) && r.copyId,
  )
  const toMatch = (r: BookRequest): HoldMatch => ({
    request: r,
    user: userById(r.userId),
    book: bookById(r.bookId),
    copy: copyById(r.copyId)!,
  })
  const active = matches.filter((r) => r.status === "approved")
  if (active.length) return delay({ kind: "found", holds: active.map(toMatch) })
  const expired = matches
    .filter((r) => r.status === "expired" && !r.rejectReason)
    .sort((a, b) =>
      (b.holdExpiresAt ?? "").localeCompare(a.holdExpiresAt ?? ""),
    )
  if (expired.length)
    return delay({ kind: "expired", hold: toMatch(expired[0]) })
  return delay({ kind: "not_found", user })
}

export async function collectHold(requestId: string): Promise<Loan> {
  sweepExpiredHolds()
  const req = requests.find((r) => r._id === requestId)
  if (!req || req.status !== "approved")
    return fail("This hold is no longer active.")
  const copy = copyById(req.copyId)
  if (!copy) return fail("The held copy could not be found.")
  const loan = startLoan(req.userId, copy)
  req.status = "fulfilled"
  logActivity("collected", req.userId, req.bookId)
  return delay(loan)
}

/* ---------- Direct issue ---------- */

export interface Eligibility {
  booksOut: number
  limit: number
  fines: number
  threshold: number
  status: User["status"]
  checks: { books: boolean fines: boolean account: boolean }
  eligible: boolean
}

function eligibilityFor(user: User): Eligibility {
  const booksOut = activeLoans(user._id).length + activeHolds(user._id).length
  const fines = outstandingFines(user._id)
  const checks = {
    books: booksOut < settings.maxBooksPerUser,
    fines: fines < settings.fineBlockThreshold,
    account: user.status === "active",
  }
  return {
    booksOut,
    limit: settings.maxBooksPerUser,
    fines,
    threshold: settings.fineBlockThreshold,
    status: user.status,
    checks,
    eligible: checks.books && checks.fines && checks.account,
  }
}

export async function getEligibility(userId: string): Promise<Eligibility> {
  sweepExpiredHolds()
  return delay(eligibilityFor(userById(userId)))
}

export async function findMembers(query: string): Promise<User[]> {
  const q = query.trim().toLowerCase()
  const students = users.filter((u) => u.role === "student")
  const result = q
    ? students.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.includes(q) ||
          (u.usn ?? "").toLowerCase().includes(q),
      )
    : students
  return delay(result.slice(0, 8))
}

export interface AdminMemberRow {
  user: User
  booksOut: number
  fines: number
}

export async function listAdminMembers(input: {
  q?: string
  status?: "all" | User["status"]
}): Promise<AdminMemberRow[]> {
  const q = input.q?.trim().toLowerCase() ?? ""
  return delay(
    users
      .filter((user) => user.role === "student")
      .filter(
        (user) =>
          !q ||
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          (user.usn ?? "").toLowerCase().includes(q),
      )
      .filter(
        (user) =>
          !input.status ||
          input.status === "all" ||
          user.status === input.status,
      )
      .map((user) => ({
        user,
        booksOut: activeLoans(user._id).length,
        fines: outstandingFines(user._id),
      }))
      .sort((a, b) => a.user.name.localeCompare(b.user.name)),
  )
}

export interface AdminMemberDetail {
  user: User
  active: LoanView[]
  history: LoanView[]
  fines: FineItem[]
  stats: {
    active: number
    holds: number
    totalBorrowed: number
    fines: number
  }
}

export async function getAdminMember(
  userId: string,
): Promise<AdminMemberDetail | null> {
  const user = users.find(
    (item) => item._id === userId && item.role === "student",
  )
  if (!user) return delay(null)
  const memberLoans = loans.filter((loan) => loan.userId === userId)
  return delay({
    user,
    active: memberLoans
      .filter((loan) => loan.status === "active")
      .map(toLoanView),
    history: memberLoans
      .filter((loan) => loan.status !== "active")
      .map(toLoanView),
    fines: allFineItems().filter((item) => item.user._id === userId),
    stats: {
      active: activeLoans(userId).length,
      holds: activeHolds(userId).length,
      totalBorrowed: memberLoans.length,
      fines: outstandingFines(userId),
    },
  })
}

export async function setMemberStatus(
  userId: string,
  status: User["status"],
): Promise<User> {
  const user = users.find((item) => item._id === userId)
  if (!user) return fail("Member not found.")
  user.status = status
  return delay(user)
}

export async function forceReturnLoan(loanId: string): Promise<void> {
  const loan = loans.find(
    (item) => item._id === loanId && item.status === "active",
  )
  if (!loan) return fail("Active loan not found.")
  const fine = fineBalance(loan)
  if (fine > 0)
    finePayments.push({
      _id: newId("f"),
      loanId,
      amount: fine,
      action: "waived",
      reason: "Force returned by librarian",
      at: new Date().toISOString(),
    })
  loan.status = "returned"
  loan.returnedAt = new Date().toISOString()
  const copy = copyById(loan.copyId)
  if (copy) copy.status = "available"
  logActivity("returned", loan.userId, loan.bookId, "Force returned")
  return delay(undefined)
}

export interface FineLedger {
  rows: FineItem[]
  outstanding: number
  collected: number
  waived: number
  students: number
}

export async function listFines(days?: number): Promise<FineLedger> {
  const cutoff = days ? Date.now() - days * DAY : 0
  const rows = allFineItems().filter(
    (item) => new Date(item.date).getTime() >= cutoff,
  )
  return delay({
    rows,
    outstanding: rows
      .filter((item) => item.status === "outstanding")
      .reduce((sum, item) => sum + item.amount, 0),
    collected: rows
      .filter((item) => item.status === "collected")
      .reduce((sum, item) => sum + item.amount, 0),
    waived: rows
      .filter((item) => item.status === "waived")
      .reduce((sum, item) => sum + item.amount, 0),
    students: new Set(
      rows
        .filter((item) => item.status === "outstanding")
        .map((item) => item.user._id),
    ).size,
  })
}

export async function settleFine(
  loanId: string,
  action: "collected" | "waived",
  reason?: string,
): Promise<void> {
  const loan = loans.find((item) => item._id === loanId)
  if (!loan) return fail("Loan not found.")
  const amount = fineBalance(loan)
  if (!amount) return fail("This fine has already been settled.")
  if (action === "waived" && !reason?.trim())
    return fail("A reason is required to waive a fine.")
  finePayments.push({
    _id: newId("f"),
    loanId,
    amount,
    action,
    reason: reason?.trim() || null,
    at: new Date().toISOString(),
  })
  return delay(undefined)
}

export async function updateSettings(input: Settings): Promise<Settings> {
  Object.assign(settings, input)
  return delay(settings)
}

export async function getAdminBook(bookId: string): Promise<Book | null> {
  sweepExpiredHolds()
  const book = books.find((b) => b._id === bookId)
  return delay(book ? withAvailability(book) : null)
}

export interface AdminBookInput {
  title: string
  authors: string[]
  isbn: string
  genres: string[]
  publisher: string
  year: number
  language: string
  description: string
  shelfLocation: string
  coverColor: string
  copies?: number
}

export interface AdminBookPage {
  rows: Book[]
  total: number
  page: number
  pageSize: number
  pages: number
}

export async function listAdminBooks(input: {
  q?: string
  genre?: string
  availability?: "all" | "available" | "unavailable"
  page?: number
  pageSize?: number
}): Promise<AdminBookPage> {
  const q = input.q?.trim().toLowerCase() ?? ""
  const pageSize = input.pageSize ?? 10
  const filtered = books
    .filter((book) => !book.archived)
    .map(withAvailability)
    .filter((book) => {
      if (
        q &&
        ![book.title, ...book.authors, book.isbn, book.shelfLocation].some(
          (value) => value.toLowerCase().includes(q),
        )
      )
        return false
      if (input.genre && !book.genres.includes(input.genre)) return false
      if (input.availability === "available" && book.availableCopies === 0)
        return false
      if (input.availability === "unavailable" && book.availableCopies > 0)
        return false
      return true
    })
    .sort((a, b) => a.title.localeCompare(b.title))
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(Math.max(input.page ?? 1, 1), pages)
  return delay({
    rows: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
    pages,
  })
}

export async function isDuplicateIsbn(
  isbn: string,
  exceptBookId?: string,
): Promise<boolean> {
  const normalized = isbn.replace(/-/g, "").trim()
  return delay(
    books.some(
      (book) =>
        book._id !== exceptBookId && book.isbn.replace(/-/g, "") === normalized,
    ),
  )
}

export async function lookupIsbn(isbn: string): Promise<AdminBookInput> {
  if (!isbn.trim()) return fail("Enter an ISBN to look up.")
  return delay({
    title: "Clean Architecture",
    authors: ["Robert C. Martin"],
    isbn: isbn.trim(),
    genres: ["Computer Science"],
    publisher: "Prentice Hall",
    year: 2017,
    language: "English",
    description:
      "A practical guide to structuring software systems for maintainability, testability and long-term change.",
    shelfLocation: "CS-142",
    coverColor: "#4A5662",
    copies: 1,
  })
}

export async function createAdminBook(input: AdminBookInput): Promise<Book> {
  if (await isDuplicateIsbn(input.isbn))
    return fail("A book with this ISBN already exists.")
  const { copies: copyCount = 0, ...details } = input
  const book: Book = {
    _id: newId("b"),
    ...details,
    totalCopies: 0,
    availableCopies: 0,
    archived: false,
  }
  books.push(book)
  for (let i = 0; i < copyCount; i++) addCopyRecord(book._id)
  return delay(withAvailability(book))
}

export async function updateAdminBook(
  bookId: string,
  input: AdminBookInput,
): Promise<Book> {
  const book = books.find((item) => item._id === bookId)
  if (!book) return fail("Book not found.")
  if (await isDuplicateIsbn(input.isbn, bookId))
    return fail("A book with this ISBN already exists.")
  const { copies: _copyCount, ...details } = input
  Object.assign(book, details)
  return delay(withAvailability(book))
}

export async function archiveAdminBooks(bookIds: string[]): Promise<void> {
  books.forEach((book) => {
    if (bookIds.includes(book._id)) book.archived = true
  })
  return delay(undefined)
}

export interface AdminCopyView {
  copy: Copy
  holder: User | null
}

function nextBarcode(): string {
  const next =
    Math.max(
      0,
      ...copies.map((copy) => Number(copy.barcode.replace(/\D/g, "")) || 0),
    ) + 1
  return `SS-${String(next).padStart(5, "0")}`
}

function addCopyRecord(bookId: string): Copy {
  const own = copies.filter((copy) => copy.bookId === bookId)
  const copy: Copy = {
    _id: `${bookId}-c${own.length + 1}-${Date.now().toString(36)}`,
    bookId,
    barcode: nextBarcode(),
    condition: "good",
    status: "available",
    addedAt: new Date().toISOString(),
  }
  copies.push(copy)
  return copy
}

export async function listAdminCopies(
  bookId: string,
): Promise<AdminCopyView[]> {
  return delay(
    copies
      .filter((copy) => copy.bookId === bookId)
      .map((copy) => {
        const loan = loans.find(
          (item) => item.copyId === copy._id && item.status === "active",
        )
        return { copy, holder: loan ? userById(loan.userId) : null }
      }),
  )
}

export async function addAdminCopy(bookId: string): Promise<Copy> {
  if (!books.some((book) => book._id === bookId)) return fail("Book not found.")
  return delay(addCopyRecord(bookId))
}

export async function updateAdminCopy(
  copyId: string,
  patch: {
    condition?: Copy["condition"]
    status?: CopyStatus
  },
): Promise<Copy> {
  const copy = copies.find((item) => item._id === copyId)
  if (!copy) return fail("Copy not found.")
  if (patch.status === "retired" && copy.status === "borrowed")
    return fail("A borrowed copy cannot be retired until it is returned.")
  Object.assign(copy, patch)
  return delay(copy)
}

export async function getCopiesForBook(bookId: string): Promise<Copy[]> {
  sweepExpiredHolds()
  return delay(copies.filter((c) => c.bookId === bookId))
}

export async function directIssue(
  userId: string,
  copyId: string,
  overrideReason?: string,
): Promise<Loan> {
  sweepExpiredHolds()
  const user = users.find((u) => u._id === userId)
  const copy = copyById(copyId)
  if (!user || !copy) return fail("Member or copy not found.")
  if (copy.status !== "available")
    return fail(`Copy ${copy.barcode} is not on the shelf.`)
  const eligibility = eligibilityFor(user)
  if (!eligibility.eligible && !overrideReason?.trim())
    return fail(
      "This member is not eligible. Add an override reason to continue.",
    )
  const loan = startLoan(userId, copy)
  logActivity(
    "issued",
    userId,
    copy.bookId,
    overrideReason?.trim() ? `Override: ${overrideReason.trim()}` : null,
  )
  return delay(loan)
}

/* ---------- Return ---------- */

export interface ReturnMatch {
  loan: Loan
  user: User
  book: Book
  copy: Copy
  daysOverdue: number
  fine: number
  finePerDay: number
}

export async function findLoanByBarcode(
  barcode: string,
): Promise<ReturnMatch | null> {
  const copy = copies.find((c) => c.barcode === barcode.trim().toUpperCase())
  const loan =
    copy && loans.find((l) => l.copyId === copy._id && l.status === "active")
  if (!copy || !loan) return delay(null)
  return delay({
    loan,
    user: userById(loan.userId),
    book: bookById(loan.bookId),
    copy,
    daysOverdue: daysOverdue(loan),
    fine: fineBalance(loan),
    finePerDay: settings.finePerDay,
  })
}

export async function returnLoan(
  loanId: string,
  input: {
    condition: ReturnCondition
    fineAction?: "collected" | "waived"
    waiveReason?: string
  },
): Promise<void> {
  const loan = loans.find((l) => l._id === loanId && l.status === "active")
  if (!loan) return fail("This loan is already closed.")
  const fine = fineBalance(loan)
  if (fine > 0 && !input.fineAction)
    return fail("Collect or waive the fine first.")
  if (input.fineAction === "waived" && !input.waiveReason?.trim())
    return fail("A reason is required to waive a fine.")
  const copy = copyById(loan.copyId)!
  const now = new Date().toISOString()
  loan.status = "returned"
  loan.returnedAt = now
  copy.condition = input.condition === "damaged" ? "poor" : input.condition
  copy.status = input.condition === "damaged" ? "damaged" : "available"
  if (fine > 0)
    finePayments.push({
      _id: newId("f"),
      loanId,
      amount: fine,
      action: input.fineAction!,
      reason: input.waiveReason?.trim() || null,
      at: now,
    })
  const note =
    fine > 0
      ? `${rupeesText(fine)} fine ${input.fineAction}`
      : input.condition === "damaged"
        ? "Returned damaged"
        : null
  logActivity("returned", loan.userId, loan.bookId, note)
  return delay(undefined)
}

const rupeesText = (n: number) => `₹${n}`

export interface ReturnedToday {
  loan: Loan
  user: User
  book: Book
  copy: Copy
  payment: FinePayment | null
}

export async function getTodaysReturns(): Promise<ReturnedToday[]> {
  const rows = loans
    .filter((l) => l.status === "returned" && isToday(l.returnedAt))
    .sort((a, b) => (b.returnedAt ?? "").localeCompare(a.returnedAt ?? ""))
    .map((l) => ({
      loan: l,
      user: userById(l.userId),
      book: bookById(l.bookId),
      copy: copyById(l.copyId)!,
      payment: finePayments.find((p) => p.loanId === l._id) ?? null,
    }))
  return delay(rows)
}

/* ---------- Overdue ---------- */

export interface OverdueRow {
  loan: Loan
  user: User
  book: Book
  copy: Copy
  daysOverdue: number
  fine: number
  lastRemindedAt: string | null
}

export async function getOverdue(): Promise<OverdueRow[]> {
  const rows = loans
    .filter((l) => l.status === "active" && daysOverdue(l) > 0)
    .map((l) => ({
      loan: l,
      user: userById(l.userId),
      book: bookById(l.bookId),
      copy: copyById(l.copyId)!,
      daysOverdue: daysOverdue(l),
      fine: fineBalance(l),
      lastRemindedAt:
        reminders
          .filter((m) => m.loanId === l._id)
          .map((m) => m.sentAt)
          .sort()
          .at(-1) ?? null,
    }))
  return delay(rows)
}

export async function sendReminders(loanIds: string[]): Promise<number> {
  const now = new Date().toISOString()
  for (const loanId of loanIds) {
    const loan = loans.find((l) => l._id === loanId)
    if (!loan) continue
    reminders.push({ _id: newId("m"), loanId, sentAt: now })
    logActivity("reminded", loan.userId, loan.bookId)
  }
  return delay(loanIds.length)
}

/* ---------- Dashboard ---------- */

export interface DayCount {
  date: string
  count: number
}

export async function getBorrowsByDay(days = 7): Promise<DayCount[]> {
  const result: DayCount[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const key = d.toDateString()
    result.push({
      date: d.toISOString(),
      count: loans.filter((l) => new Date(l.issuedAt).toDateString() === key)
        .length,
    })
  }
  return delay(result)
}

export interface ActivityView extends ActivityEvent {
  userName: string
  bookTitle: string
}

export async function getActivity(limit = 8): Promise<ActivityView[]> {
  const rows = [...activity]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit)
    .map((a) => ({
      ...a,
      userName: userById(a.userId).name,
      bookTitle: bookById(a.bookId).title,
    }))
  return delay(rows)
}

/* ---------- Global search ---------- */

export interface AdminSearchResult {
  members: User[]
  books: Book[]
  copies: Array<{ copy: Copy book: Book state: "loan" | "hold" | "shelf" }>
}

export async function adminSearch(query: string): Promise<AdminSearchResult> {
  sweepExpiredHolds()
  const q = query.trim().toLowerCase()
  if (q.length < 2) return delay({ members: [], books: [], copies: [] })
  const members = users
    .filter(
      (u) =>
        u.role === "student" &&
        (u.name.toLowerCase().includes(q) ||
          (u.usn ?? "").toLowerCase().includes(q)),
    )
    .slice(0, 4)
  const matchedBooks = books
    .filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.isbn.replace(/-/g, "").includes(q.replace(/-/g, "")),
    )
    .slice(0, 4)
    .map(withAvailability)
  const matchedCopies = copies
    .filter((c) => c.barcode.toLowerCase().includes(q))
    .slice(0, 4)
    .map((c) => ({
      copy: c,
      book: bookById(c.bookId),
      state: (c.status === "borrowed"
        ? "loan"
        : c.status === "on_hold"
          ? "hold"
          : "shelf") as "loan" | "hold" | "shelf",
    }))
  return delay({ members, books: matchedBooks, copies: matchedCopies })
}
