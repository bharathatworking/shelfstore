import type { ClientSession } from "mongoose"
import { newId, withTxn } from "../db"
import { fail } from "../errors"
import { Activities, Copies, FinePayments, Loans, Requests, Users } from "../models"
import type { ActivityType, BookRequest, Copy, FinePayment, Loan, Settings, User } from "../types"
import { claimCopy, transitionCopy } from "./copies"
import {
  actionFor,
  booksWithPendingRequests,
  eligibilityFor,
  fineBalances,
  loanView,
  memberTotal,
  renewBlockedReason,
} from "./derived"
import { bookById, DAY, HOUR, iso } from "./lookups"
import { getSettings } from "./settings"

/* Every rule that changes circulation state lives here, not in the client. */

export async function logActivity(
  type: ActivityType,
  userId: string,
  bookId: string,
  note: string | null = null,
  session?: ClientSession,
) {
  await Activities.create(
    [{ _id: newId("a"), type, userId, bookId, at: new Date().toISOString(), note }],
    { session },
  )
}

async function startLoan(
  userId: string,
  copy: Copy,
  s: Settings,
  session: ClientSession,
): Promise<Loan> {
  const now = Date.now()
  const loan: Loan = {
    _id: newId("l"),
    userId,
    bookId: copy.bookId,
    copyId: copy._id,
    issuedAt: iso(now),
    dueDate: iso(now + s.loanPeriodDays * DAY),
    returnedAt: null,
    renewCount: 0,
    status: "active",
  }
  await Loans.create([loan], { session })
  return loan
}

/* ---------- Member requests ---------- */

export async function requestBook(userId: string, bookId: string) {
  const s = await getSettings()
  const [user, book] = await Promise.all([Users.findById(userId).lean<User>(), bookById(bookId)])
  if (!user || !book) fail("Book or member not found.", 404)
  if (user.status === "suspended")
    fail("Your account is suspended. Please contact the library desk.")
  const existing = await actionFor(user, book, s)
  if (existing.kind === "borrowed" || existing.kind === "requested")
    fail("You already have this book or a request for it.")

  const noCopies = "No copies are available right now. You are on the waitlist."
  const baseFlags: string[] = []
  const t = await memberTotal(userId, s)
  const used = t.loans + t.holds
  if (used >= s.maxBooksPerUser)
    baseFlags.push(`You already have ${used} of ${s.maxBooksPerUser} books out or on hold.`)
  if (t.fines >= s.fineBlockThreshold)
    baseFlags.push(
      `Outstanding fines of ₹${t.fines} are above the ₹${s.fineBlockThreshold} limit.`,
    )
  if (!(await Copies.exists({ bookId, status: "available" }))) baseFlags.push(noCopies)
  if (baseFlags.length === 0 && s.requireManualApproval)
    baseFlags.push("The library is reviewing every request manually right now.")

  return withTxn(async (session) => {
    const flags = [...baseFlags]
    // Claimed with status "available" in the filter, so two members can't get the same copy.
    const copy = flags.length ? null : await claimCopy(bookId, "on_hold", session)
    if (!flags.length && !copy) flags.push(noCopies)

    const now = Date.now()
    const base = {
      _id: newId("r"),
      userId,
      bookId,
      requestedAt: iso(now),
      rejectReason: null,
    }
    const request: BookRequest = copy
      ? {
          ...base,
          copyId: copy._id,
          status: "approved",
          decidedAt: iso(now),
          holdExpiresAt: iso(now + s.holdHours * HOUR),
          flagReason: null,
        }
      : {
          ...base,
          copyId: null,
          status: "pending",
          decidedAt: null,
          holdExpiresAt: null,
          flagReason: flags.join(" "),
        }
    await Requests.create([request], { session })
    await logActivity("requested", userId, bookId, null, session)
    return { request, book: (await bookById(bookId, session))! }
  })
}

export async function cancelRequest(userId: string, requestId: string) {
  await withTxn(async (session) => {
    const before = await Requests.findOneAndUpdate(
      { _id: requestId, userId, status: { $in: ["pending", "approved"] } },
      {
        $set: {
          status: "expired",
          decidedAt: new Date().toISOString(),
          rejectReason: "Cancelled by you",
        },
      },
      { session },
    ).lean<BookRequest>()
    if (!before) fail("This request can no longer be cancelled.")
    if (before.copyId)
      await transitionCopy({ _id: before.copyId, status: "on_hold" }, "available", session)
  })
}

export async function renewLoan(userId: string, loanId: string) {
  const s = await getSettings()
  const loan = await Loans.findOne({ _id: loanId, userId, status: "active" }).lean<Loan>()
  if (!loan) fail("Loan not found.", 404)
  const reason = renewBlockedReason(loan, s, await booksWithPendingRequests([loan.bookId]))
  if (reason) fail(`This book cannot be renewed. ${reason}.`)
  const updated = await Loans.findOneAndUpdate(
    // Guard on renewCount so a double click can't renew twice.
    { _id: loanId, status: "active", renewCount: loan.renewCount },
    {
      $inc: { renewCount: 1 },
      $set: { dueDate: iso(new Date(loan.dueDate).getTime() + s.loanPeriodDays * DAY) },
    },
    { new: true },
  ).lean<Loan>()
  if (!updated) fail("This loan changed while renewing. Please try again.", 409)
  return loanView(updated, s)
}

/* ---------- Librarian queue ---------- */

export async function approveRequest(requestId: string) {
  const s = await getSettings()
  return withTxn(async (session) => {
    const request = await Requests.findOne({ _id: requestId, status: "pending" })
      .session(session)
      .lean<BookRequest>()
    if (!request) fail("This request has already been decided.")
    const copy = await claimCopy(request.bookId, "on_hold", session)
    if (!copy) fail("No copy of this book is free to hold.")
    const now = Date.now()
    const patch = {
      copyId: copy._id,
      status: "approved" as const,
      decidedAt: iso(now),
      holdExpiresAt: iso(now + s.holdHours * HOUR),
    }
    const { modifiedCount } = await Requests.updateOne(
      { _id: requestId, status: "pending" },
      { $set: patch },
      { session },
    )
    if (!modifiedCount) fail("This request has already been decided.")
    await logActivity("approved", request.userId, request.bookId, null, session)
    return {
      request: { ...request, ...patch },
      user: (await Users.findById(request.userId).session(session).lean<User>())!,
      book: (await bookById(request.bookId, session))!,
      copy,
      flagReason: null,
    }
  })
}

export async function rejectRequest(requestId: string, reason: string) {
  const request = await Requests.findOne({ _id: requestId, status: "pending" }).lean<BookRequest>()
  if (!request) fail("This request has already been decided.")
  if (!reason?.trim()) fail("A reason is required.")
  await withTxn(async (session) => {
    const { modifiedCount } = await Requests.updateOne(
      { _id: requestId, status: "pending" },
      {
        $set: {
          status: "rejected",
          decidedAt: new Date().toISOString(),
          rejectReason: reason.trim(),
        },
      },
      { session },
    )
    if (!modifiedCount) fail("This request has already been decided.")
    await logActivity("rejected", request.userId, request.bookId, reason.trim(), session)
  })
}

/* ---------- Desk ---------- */

/** Only an approved, unexpired hold can be collected. */
export async function collectHold(requestId: string): Promise<Loan> {
  const s = await getSettings()
  return withTxn(async (session) => {
    const request = await Requests.findOne({ _id: requestId, status: "approved" })
      .session(session)
      .lean<BookRequest>()
    if (
      !request ||
      !request.holdExpiresAt ||
      new Date(request.holdExpiresAt).getTime() <= Date.now()
    )
      fail("This hold is no longer active.")
    const copy = await transitionCopy(
      { _id: request.copyId, status: "on_hold" },
      "borrowed",
      session,
    )
    if (!copy) fail("The held copy could not be found.")
    const loan = await startLoan(request.userId, copy, s, session)
    const { modifiedCount } = await Requests.updateOne(
      { _id: requestId, status: "approved" },
      { $set: { status: "fulfilled" } },
      { session },
    )
    if (!modifiedCount) fail("This hold is no longer active.")
    await logActivity("collected", request.userId, request.bookId, null, session)
    return loan
  })
}

export async function directIssue(userId: string, copyId: string, overrideReason?: string) {
  const s = await getSettings()
  const [user, copy] = await Promise.all([
    Users.findById(userId).lean<User>(),
    Copies.findById(copyId).lean<Copy>(),
  ])
  if (!user || !copy) fail("Member or copy not found.", 404)
  if (copy.status !== "available") fail(`Copy ${copy.barcode} is not on the shelf.`)
  const eligibility = eligibilityFor(user, await memberTotal(userId, s), s)
  const override = overrideReason?.trim()
  if (!eligibility.eligible && !override)
    fail("This member is not eligible. Add an override reason to continue.")
  return withTxn(async (session) => {
    const claimed = await transitionCopy(
      { _id: copyId, status: "available" },
      "borrowed",
      session,
    )
    if (!claimed) fail(`Copy ${copy.barcode} is not on the shelf.`)
    const loan = await startLoan(userId, claimed, s, session)
    await logActivity(
      "issued",
      userId,
      copy.bookId,
      override ? `Override: ${override}` : null,
      session,
    )
    return loan
  })
}

export type ReturnCondition = "good" | "fair" | "poor" | "damaged"

/** Closes an active loan inside the session; null when it was already closed. */
async function closeLoan(loanId: string, at: string, session: ClientSession) {
  return Loans.findOneAndUpdate(
    { _id: loanId, status: "active" },
    { $set: { status: "returned", returnedAt: at } },
    { session, new: true },
  ).lean<Loan>()
}

async function recordPayment(
  loanId: string,
  amount: number,
  action: FinePayment["action"],
  reason: string | null,
  at: string,
  session: ClientSession,
) {
  await FinePayments.create([{ _id: newId("f"), loanId, amount, action, reason, at }], {
    session,
  })
}

export async function returnLoan(
  loanId: string,
  input: {
    condition: ReturnCondition
    fineAction?: "collected" | "waived"
    waiveReason?: string
  },
) {
  const s = await getSettings()
  const loan = await Loans.findOne({ _id: loanId, status: "active" }).lean<Loan>()
  if (!loan) fail("This loan is already closed.")
  const fine = (await fineBalances([loan], s)).get(loan._id) ?? 0
  if (fine > 0 && !input.fineAction) fail("Collect or waive the fine first.")
  if (input.fineAction === "waived" && !input.waiveReason?.trim())
    fail("A reason is required to waive a fine.")

  await withTxn(async (session) => {
    const now = new Date().toISOString()
    if (!(await closeLoan(loanId, now, session))) fail("This loan is already closed.")
    const damaged = input.condition === "damaged"
    await transitionCopy({ _id: loan.copyId }, damaged ? "damaged" : "available", session, {
      condition: damaged ? "poor" : (input.condition as Copy["condition"]),
    })
    if (fine > 0)
      await recordPayment(
        loanId,
        fine,
        input.fineAction!,
        input.waiveReason?.trim() || null,
        now,
        session,
      )
    const note =
      fine > 0 ? `₹${fine} fine ${input.fineAction}` : damaged ? "Returned damaged" : null
    await logActivity("returned", loan.userId, loan.bookId, note, session)
  })
}

export async function forceReturnLoan(loanId: string) {
  const s = await getSettings()
  const loan = await Loans.findOne({ _id: loanId, status: "active" }).lean<Loan>()
  if (!loan) fail("Active loan not found.", 404)
  const fine = (await fineBalances([loan], s)).get(loan._id) ?? 0
  await withTxn(async (session) => {
    const now = new Date().toISOString()
    if (!(await closeLoan(loanId, now, session))) fail("Active loan not found.", 404)
    if (fine > 0)
      await recordPayment(loanId, fine, "waived", "Force returned by librarian", now, session)
    await transitionCopy({ _id: loan.copyId }, "available", session)
    await logActivity("returned", loan.userId, loan.bookId, "Force returned", session)
  })
}

export async function settleFine(
  loanId: string,
  action: "collected" | "waived",
  reason?: string,
) {
  const s = await getSettings()
  const loan = await Loans.findById(loanId).lean<Loan>()
  if (!loan) fail("Loan not found.", 404)
  const amount = (await fineBalances([loan], s)).get(loan._id) ?? 0
  if (!amount) fail("This fine has already been settled.")
  if (action === "waived" && !reason?.trim()) fail("A reason is required to waive a fine.")
  await withTxn((session) =>
    recordPayment(
      loanId,
      amount,
      action,
      reason?.trim() || null,
      new Date().toISOString(),
      session,
    ),
  )
}
