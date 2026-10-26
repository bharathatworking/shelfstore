import { Router } from "express"
import { fail } from "../errors"
import { selfOrAdmin } from "../middleware/auth"
import { Copies, Loans, Requests, SavedBooks, Users } from "../models"
import { cancelRequest, renewLoan, requestBook } from "../services/circulation"
import { actionFor, daysOverdue, fineItems, loanView, loanViews, memberTotal } from "../services/derived"
import { bookById, booksMap, copyById, must, userById } from "../services/lookups"
import { getSettings } from "../services/settings"
import { newId } from "../db"
import type { Book, BookRequest, Copy, Loan, User } from "../types"

/** Routes under /api/users/:userId. Mounted behind requireAuth. */
export const memberRoutes = Router()

memberRoutes.param("userId", (_req, res, next, userId: string) => {
  selfOrAdmin(res, userId)
  next()
})

export const COPY_ORDER = { addedAt: 1, _id: 1 } as const

memberRoutes.get("/:userId", async (req, res) => {
  res.json(await userById(req.params.userId))
})

memberRoutes.patch("/:userId", async (req, res) => {
  const { userId } = req.params
  const name = String(req.body?.name ?? "").trim()
  const email = String(req.body?.email ?? "").trim().toLowerCase()
  if (await Users.exists({ email, _id: { $ne: userId } }))
    fail("An account with this email already exists.", 409)
  const user = await Users.findByIdAndUpdate(
    userId,
    { $set: { name, email } },
    { new: true },
  ).lean<User>()
  if (!user) fail("Member not found.", 404)
  res.json(user)
})

memberRoutes.get("/:userId/books/:bookId", async (req, res) => {
  const { userId, bookId } = req.params
  const s = await getSettings()
  const [book, user] = await Promise.all([bookById(bookId), userById(userId)])
  if (!book || !user) {
    res.json(null)
    return
  }
  const [copies, action, saved] = await Promise.all([
    Copies.find({ bookId }).sort(COPY_ORDER).lean<Copy[]>(),
    actionFor(user, book, s),
    SavedBooks.exists({ userId, bookId }),
  ])
  res.json({ book, copies, action, saved: Boolean(saved) })
})

memberRoutes.post("/:userId/requests", async (req, res) => {
  res.status(201).json(await requestBook(req.params.userId, String(req.body?.bookId)))
})

memberRoutes.post("/:userId/requests/:requestId/cancel", async (req, res) => {
  await cancelRequest(req.params.userId, req.params.requestId)
  res.status(204).end()
})

memberRoutes.post("/:userId/loans/:loanId/renew", async (req, res) => {
  res.json(await renewLoan(req.params.userId, req.params.loanId))
})

type HistoryStatus = "returned" | "lost" | "rejected" | "expired" | "cancelled"

memberRoutes.get("/:userId/my-books", async (req, res) => {
  const { userId } = req.params
  const s = await getSettings()
  const [mine, loans] = await Promise.all([
    Requests.find({ userId }).lean<BookRequest[]>(),
    Loans.find({ userId }).sort({ _id: 1 }).lean<Loan[]>(),
  ])
  const books = await booksMap([...mine, ...loans].map((row) => row.bookId))
  const active = await loanViews(
    loans.filter((l) => l.status === "active"),
    s,
  )

  const loanHistory = loans
    .filter((l) => l.status !== "active")
    .map((l) => ({
      _id: l._id,
      book: must(books, l.bookId),
      kind: "loan" as const,
      status: (l.status === "lost" ? "lost" : "returned") as HistoryStatus,
      date: l.returnedAt ?? l.dueDate,
      note: null,
    }))
  const requestHistory = mine
    .filter((r) => r.status === "rejected" || r.status === "expired")
    .map((r) => {
      const cancelled = r.rejectReason === "Cancelled by you"
      return {
        _id: r._id,
        book: must(books, r.bookId),
        kind: "request" as const,
        status: (cancelled
          ? "cancelled"
          : r.status === "rejected"
            ? "rejected"
            : "expired") as HistoryStatus,
        date: r.decidedAt ?? r.holdExpiresAt ?? r.requestedAt,
        note: cancelled
          ? null
          : r.status === "rejected"
            ? r.rejectReason
            : "Hold was not collected in time",
      }
    })

  res.json({
    active: active.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    requests: mine
      .filter((r) => r.status === "pending" || r.status === "approved")
      .map((r) => ({ ...r, book: must(books, r.bookId) }))
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    history: [...loanHistory, ...requestHistory].sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
    totalFines: active.reduce((sum, loan) => sum + loan.fine, 0),
    limit: s.maxBooksPerUser,
  })
})

memberRoutes.get("/:userId/alerts", async (req, res) => {
  const { userId } = req.params
  const s = await getSettings()
  const [loans, holds] = await Promise.all([
    Loans.find({ userId, status: "active" }).lean<Loan[]>(),
    Requests.countDocuments({ userId, status: "approved" }),
  ])
  const views = await loanViews(loans, s)
  res.json({
    overdue: views.filter((v) => v.daysOverdue > 0).length,
    dueSoon: views.filter((v) => v.dueSoon).length,
    readyToCollect: holds,
  })
})

memberRoutes.get("/:userId/saved", async (req, res) => {
  const saved = await SavedBooks.find({ userId: req.params.userId })
    .sort({ savedAt: -1 })
    .lean<Array<{ bookId: string }>>()
  const books = await booksMap(saved.map((s) => s.bookId))
  res.json(saved.map((s) => books.get(s.bookId)).filter((b): b is Book => Boolean(b)))
})

memberRoutes.post("/:userId/saved/:bookId/toggle", async (req, res) => {
  const { userId, bookId } = req.params
  if (await SavedBooks.findOneAndDelete({ userId, bookId })) {
    res.json(false)
    return
  }
  try {
    await SavedBooks.create({ _id: newId("s"), userId, bookId, savedAt: new Date().toISOString() })
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err
  }
  res.json(true)
})

memberRoutes.get("/:userId/profile", async (req, res) => {
  const { userId } = req.params
  const user = await userById(userId)
  if (!user) {
    res.json(null)
    return
  }
  const s = await getSettings()
  const [totals, totalBorrowed] = await Promise.all([
    memberTotal(userId, s),
    Loans.countDocuments({ userId }),
  ])
  res.json({
    user,
    activeCount: totals.loans,
    holdCount: totals.holds,
    totalBorrowed,
    totalFines: totals.fines,
    settings: s,
  })
})

memberRoutes.get("/:userId/loans/:loanId", async (req, res) => {
  const { userId, loanId } = req.params
  const loan = await Loans.findOne({ _id: loanId, userId }).lean<Loan>()
  if (!loan) {
    res.json(null)
    return
  }
  const s = await getSettings()
  const [view, copy, request] = await Promise.all([
    loanView(loan, s),
    copyById(loan.copyId),
    Requests.findOne({ userId, bookId: loan.bookId })
      .sort({ requestedAt: -1 })
      .lean<BookRequest>(),
  ])
  res.json({
    loan: view,
    copy,
    requestedAt: request?.requestedAt ?? null,
    collectedAt: loan.issuedAt,
  })
})

memberRoutes.get("/:userId/fines", async (req, res) => {
  const { userId } = req.params
  const s = await getSettings()
  const [totals, items] = await Promise.all([memberTotal(userId, s), fineItems(s, userId)])
  res.json({ balance: totals.fines, items, settings: s })
})

interface MemberNotification {
  _id: string
  title: string
  description: string
  at: string
  to: string
  read: boolean
}

async function notificationsFor(userId: string): Promise<MemberNotification[]> {
  const [user, loans, holds] = await Promise.all([
    Users.findById(userId).select("+readNotifications").lean<User & { readNotifications: string[] }>(),
    Loans.find({ userId, status: "active" }).sort({ _id: 1 }).lean<Loan[]>(),
    Requests.find({ userId, status: "approved" }).lean<BookRequest[]>(),
  ])
  const read = new Set(user?.readNotifications ?? [])
  const books = await booksMap([...loans, ...holds].map((row) => row.bookId))

  const loanNotices = loans.map((loan) => {
    const overdue = daysOverdue(loan)
    const book = must(books, loan.bookId)
    const id = `loan-${loan._id}-${overdue ? "overdue" : "due"}`
    return {
      _id: id,
      title: overdue ? "Book overdue" : "Due date reminder",
      description: overdue
        ? `${book.title} is ${overdue} ${overdue === 1 ? "day" : "days"} overdue.`
        : `${book.title} is due ${new Date(loan.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`,
      at: overdue ? new Date().toISOString() : loan.dueDate,
      to: `/loans/${loan._id}`,
      read: read.has(id),
    }
  })
  const holdNotices = holds.map((request) => {
    const id = `hold-${request._id}`
    return {
      _id: id,
      title: "Ready for collection",
      description: `${must(books, request.bookId).title} is waiting at the circulation desk.`,
      at: request.decidedAt ?? request.requestedAt,
      to: `/books/${request.bookId}`,
      read: read.has(id),
    }
  })
  return [...loanNotices, ...holdNotices].sort((a, b) => b.at.localeCompare(a.at))
}

memberRoutes.get("/:userId/notifications", async (req, res) => {
  res.json(await notificationsFor(req.params.userId))
})

memberRoutes.post("/:userId/notifications/read", async (req, res) => {
  const { userId } = req.params
  const ids = (await notificationsFor(userId)).map((n) => n._id)
  await Users.updateOne({ _id: userId }, { $addToSet: { readNotifications: { $each: ids } } })
  res.status(204).end()
})
