import { Router } from "express"
import type { FilterQuery } from "mongoose"
import { newId } from "../db"
import { fail } from "../errors"
import { int, text } from "../middleware/query"
import {
  Activities,
  Books,
  Copies,
  FinePayments,
  Loans,
  Reminders,
  Requests,
  Users,
} from "../models"
import {
  approveRequest,
  collectHold,
  directIssue,
  forceReturnLoan,
  logActivity,
  rejectRequest,
  returnLoan,
  settleFine,
} from "../services/circulation"
import {
  daysOverdue,
  eligibilityFor,
  fineBalances,
  fineItems,
  librarianFlagReason,
  loanViews,
  memberTotal,
  memberTotals,
  overdueFilter,
} from "../services/derived"
import {
  booksMap,
  contains,
  copiesMap,
  DAY,
  isbnContains,
  isToday,
  iso,
  must,
  userById,
  usersMap,
} from "../services/lookups"
import { getSettings, saveSettings } from "../services/settings"
import type {
  ActivityEvent,
  BookRequest,
  Copy,
  FinePayment,
  Loan,
  Reminder,
  User,
} from "../types"

/** Librarian routes under /api/admin. Mounted behind requireAuth + requireAdmin. */
export const adminRoutes = Router()

/* ---------- Dashboard ---------- */

adminRoutes.get("/stats", async (_req, res) => {
  const [active, pendingRequests] = await Promise.all([
    Loans.find({ status: "active" }, { dueDate: 1, status: 1 }).lean<Loan[]>(),
    Requests.countDocuments({ status: "pending" }),
  ])
  res.json({
    activeLoans: active.length,
    overdue: active.filter((l) => daysOverdue(l) > 0).length,
    pendingRequests,
    dueToday: active.filter((l) => isToday(l.dueDate)).length,
  })
})

adminRoutes.get("/borrows-by-day", async (req, res) => {
  const days = int(req, "days") ?? 7
  const loans = await Loans.find(
    { issuedAt: { $gte: iso(Date.now() - days * DAY) } },
    { issuedAt: 1 },
  ).lean<Loan[]>()
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const key = d.toDateString()
    result.push({
      date: d.toISOString(),
      count: loans.filter((l) => new Date(l.issuedAt).toDateString() === key).length,
    })
  }
  res.json(result)
})

adminRoutes.get("/activity", async (req, res) => {
  const rows = await Activities.find()
    .sort({ at: -1 })
    .limit(int(req, "limit") ?? 8)
    .lean<ActivityEvent[]>()
  const [users, books] = await Promise.all([
    usersMap(rows.map((a) => a.userId)),
    booksMap(rows.map((a) => a.bookId)),
  ])
  res.json(
    rows.map((a) => ({
      ...a,
      userName: must(users, a.userId).name,
      bookTitle: must(books, a.bookId).title,
    })),
  )
})

adminRoutes.get("/search", async (req, res) => {
  const q = text(req, "q")?.trim().toLowerCase() ?? ""
  if (q.length < 2) {
    res.json({ members: [], books: [], copies: [] })
    return
  }
  const [members, books, copies] = await Promise.all([
    Users.find({ role: "student", $or: [{ name: contains(q) }, { usn: contains(q) }] })
      .sort({ _id: 1 })
      .limit(4)
      .lean<User[]>(),
    Books.find({ $or: [{ title: contains(q) }, isbnContains(q)] })
      .sort({ _id: 1 })
      .limit(4)
      .lean(),
    Copies.find({ barcode: contains(q) }).sort({ _id: 1 }).limit(4).lean<Copy[]>(),
  ])
  const copyBooks = await booksMap(copies.map((c) => c.bookId))
  res.json({
    members,
    books,
    copies: copies.map((copy) => ({
      copy,
      book: must(copyBooks, copy.bookId),
      state:
        copy.status === "borrowed" ? "loan" : copy.status === "on_hold" ? "hold" : "shelf",
    })),
  })
})

/* ---------- Requests queue ---------- */

type QueueTab = "pending" | "approved" | "rejected"

adminRoutes.get("/requests/counts", async (_req, res) => {
  const [pending, approved, rejected] = await Promise.all(
    (["pending", "approved", "rejected"] as const).map((status) =>
      Requests.countDocuments({ status }),
    ),
  )
  res.json({ pending, approved, rejected })
})

adminRoutes.get("/requests", async (req, res) => {
  const status = (text(req, "status") ?? "pending") as QueueTab
  const limit = int(req, "limit")
  let query = Requests.find({ status }).sort(
    status === "pending" ? { requestedAt: 1 } : { decidedAt: -1 },
  )
  if (limit !== undefined) query = query.limit(limit)
  const rows = await query.lean<BookRequest[]>()
  const s = await getSettings()
  const [users, books, copies, totals] = await Promise.all([
    usersMap(rows.map((r) => r.userId)),
    booksMap(rows.map((r) => r.bookId)),
    copiesMap(rows.map((r) => r.copyId)),
    memberTotals([...new Set(rows.filter((r) => r.flagReason).map((r) => r.userId))], s),
  ])
  res.json(
    rows.map((r) => {
      const user = must(users, r.userId)
      const book = must(books, r.bookId)
      const t = totals.get(r.userId) ?? { loans: 0, holds: 0, fines: 0 }
      return {
        request: r,
        user,
        book,
        copy: (r.copyId && copies.get(r.copyId)) || null,
        flagReason: librarianFlagReason(r, user, book, t, s),
      }
    }),
  )
})

adminRoutes.post("/requests/:id/approve", async (req, res) => {
  res.json(await approveRequest(req.params.id))
})

adminRoutes.post("/requests/:id/reject", async (req, res) => {
  await rejectRequest(req.params.id, String(req.body?.reason ?? ""))
  res.status(204).end()
})

/* ---------- Collect hold ---------- */

adminRoutes.get("/holds", async (req, res) => {
  const code = (text(req, "code") ?? "").trim().toUpperCase()
  const [copy, user] = await Promise.all([
    Copies.findOne({ barcode: code }).lean<Copy>(),
    Users.findOne({ usn: code }).lean<User>(),
  ])
  if (!copy && !user) {
    res.json({ kind: "not_found", user: null })
    return
  }
  const matches = await Requests.find(
    copy ? { copyId: copy._id } : { userId: user!._id, copyId: { $ne: null } },
  )
    .sort({ _id: 1 })
    .lean<BookRequest[]>()
  const [users, books, copies] = await Promise.all([
    usersMap(matches.map((r) => r.userId)),
    booksMap(matches.map((r) => r.bookId)),
    copiesMap(matches.map((r) => r.copyId)),
  ])
  const toMatch = (r: BookRequest) => ({
    request: r,
    user: must(users, r.userId),
    book: must(books, r.bookId),
    copy: must(copies, r.copyId),
  })
  const active = matches.filter((r) => r.status === "approved")
  if (active.length) {
    res.json({ kind: "found", holds: active.map(toMatch) })
    return
  }
  const expired = matches
    .filter((r) => r.status === "expired" && !r.rejectReason)
    .sort((a, b) => (b.holdExpiresAt ?? "").localeCompare(a.holdExpiresAt ?? ""))
  if (expired.length) {
    res.json({ kind: "expired", hold: toMatch(expired[0]) })
    return
  }
  res.json({ kind: "not_found", user })
})

adminRoutes.post("/holds/:id/collect", async (req, res) => {
  res.status(201).json(await collectHold(req.params.id))
})

/* ---------- Direct issue ---------- */

adminRoutes.post("/issue", async (req, res) => {
  const { userId, copyId, overrideReason } = req.body ?? {}
  res.status(201).json(await directIssue(String(userId), String(copyId), overrideReason))
})

/* ---------- Members ---------- */

const memberSearch = (q: string): FilterQuery<User> =>
  q ? { $or: [{ name: contains(q) }, { email: contains(q) }, { usn: contains(q) }] } : {}

adminRoutes.get("/members/search", async (req, res) => {
  const q = text(req, "q")?.trim() ?? ""
  res.json(
    await Users.find({ role: "student", ...memberSearch(q) })
      .sort({ _id: 1 })
      .limit(8)
      .lean<User[]>(),
  )
})

adminRoutes.get("/members", async (req, res) => {
  const q = text(req, "q")?.trim() ?? ""
  const status = text(req, "status")
  const users = await Users.find({
    role: "student",
    ...memberSearch(q),
    ...(status && status !== "all" ? { status } : {}),
  }).lean<User[]>()
  const totals = await memberTotals(
    users.map((u) => u._id),
    await getSettings(),
  )
  res.json(
    users
      .map((user) => ({
        user,
        booksOut: totals.get(user._id)!.loans,
        fines: totals.get(user._id)!.fines,
      }))
      .sort((a, b) => a.user.name.localeCompare(b.user.name)),
  )
})

adminRoutes.get("/members/:id", async (req, res) => {
  const userId = req.params.id
  const user = await Users.findOne({ _id: userId, role: "student" }).lean<User>()
  if (!user) {
    res.json(null)
    return
  }
  const s = await getSettings()
  const memberLoans = await Loans.find({ userId }).sort({ _id: 1 }).lean<Loan[]>()
  const [views, fines, totals] = await Promise.all([
    loanViews(memberLoans, s),
    fineItems(s, userId),
    memberTotal(userId, s),
  ])
  res.json({
    user,
    active: views.filter((v) => v.status === "active"),
    history: views.filter((v) => v.status !== "active"),
    fines,
    stats: {
      active: totals.loans,
      holds: totals.holds,
      totalBorrowed: memberLoans.length,
      fines: totals.fines,
    },
  })
})

adminRoutes.get("/members/:id/eligibility", async (req, res) => {
  const user = await userById(req.params.id)
  if (!user) fail("Member not found.", 404)
  const s = await getSettings()
  res.json(eligibilityFor(user, await memberTotal(user._id, s), s))
})

adminRoutes.patch("/members/:id/status", async (req, res) => {
  const status = req.body?.status
  if (status !== "active" && status !== "suspended") fail("Choose a valid status.")
  const user = await Users.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true },
  ).lean<User>()
  if (!user) fail("Member not found.", 404)
  res.json(user)
})

/* ---------- Returns ---------- */

adminRoutes.get("/returns/find", async (req, res) => {
  const barcode = (text(req, "barcode") ?? "").trim().toUpperCase()
  const copy = await Copies.findOne({ barcode }).lean<Copy>()
  const loan = copy && (await Loans.findOne({ copyId: copy._id, status: "active" }).lean<Loan>())
  if (!copy || !loan) {
    res.json(null)
    return
  }
  const s = await getSettings()
  const [user, books, fines] = await Promise.all([
    userById(loan.userId),
    booksMap([loan.bookId]),
    fineBalances([loan], s),
  ])
  res.json({
    loan,
    user,
    book: must(books, loan.bookId),
    copy,
    daysOverdue: daysOverdue(loan),
    fine: fines.get(loan._id) ?? 0,
    finePerDay: s.finePerDay,
  })
})

adminRoutes.post("/loans/:id/return", async (req, res) => {
  await returnLoan(req.params.id, req.body ?? {})
  res.status(204).end()
})

adminRoutes.post("/loans/:id/force-return", async (req, res) => {
  await forceReturnLoan(req.params.id)
  res.status(204).end()
})

adminRoutes.get("/returns/today", async (_req, res) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const loans = await Loans.find({
    status: "returned",
    returnedAt: { $gte: start.toISOString(), $lt: iso(start.getTime() + DAY) },
  })
    .sort({ returnedAt: -1 })
    .lean<Loan[]>()
  const ids = loans.map((l) => l._id)
  const [users, books, copies, payments] = await Promise.all([
    usersMap(loans.map((l) => l.userId)),
    booksMap(loans.map((l) => l.bookId)),
    copiesMap(loans.map((l) => l.copyId)),
    FinePayments.find({ loanId: { $in: ids } }).sort({ at: 1 }).lean<FinePayment[]>(),
  ])
  res.json(
    loans.map((loan) => ({
      loan,
      user: must(users, loan.userId),
      book: must(books, loan.bookId),
      copy: must(copies, loan.copyId),
      payment: payments.find((p) => p.loanId === loan._id) ?? null,
    })),
  )
})

/* ---------- Overdue ---------- */

adminRoutes.get("/overdue", async (_req, res) => {
  const s = await getSettings()
  const loans = await Loans.find(overdueFilter()).sort({ _id: 1 }).lean<Loan[]>()
  const ids = loans.map((l) => l._id)
  const [users, books, copies, fines, reminders] = await Promise.all([
    usersMap(loans.map((l) => l.userId)),
    booksMap(loans.map((l) => l.bookId)),
    copiesMap(loans.map((l) => l.copyId)),
    fineBalances(loans, s),
    Reminders.aggregate<{ _id: string; last: string }>([
      { $match: { loanId: { $in: ids } } },
      { $group: { _id: "$loanId", last: { $max: "$sentAt" } } },
    ]),
  ])
  const lastReminded = new Map(reminders.map((r) => [r._id, r.last]))
  res.json(
    loans.map((loan) => ({
      loan,
      user: must(users, loan.userId),
      book: must(books, loan.bookId),
      copy: must(copies, loan.copyId),
      daysOverdue: daysOverdue(loan),
      fine: fines.get(loan._id) ?? 0,
      lastRemindedAt: lastReminded.get(loan._id) ?? null,
    })),
  )
})

adminRoutes.post("/reminders", async (req, res) => {
  const loanIds: string[] = Array.isArray(req.body?.loanIds) ? req.body.loanIds.map(String) : []
  const loans = await Loans.find({ _id: { $in: loanIds } }).lean<Loan[]>()
  const sentAt = new Date().toISOString()
  await Reminders.insertMany(
    loans.map((l): Reminder => ({ _id: newId("m"), loanId: l._id, sentAt })),
  )
  for (const loan of loans) await logActivity("reminded", loan.userId, loan.bookId)
  res.json(loanIds.length)
})

/* ---------- Fines ---------- */

adminRoutes.get("/fines", async (req, res) => {
  const days = int(req, "days")
  const cutoff = days ? Date.now() - days * DAY : 0
  const rows = (await fineItems(await getSettings())).filter(
    (item) => new Date(item.date).getTime() >= cutoff,
  )
  const total = (status: string) =>
    rows.filter((item) => item.status === status).reduce((sum, item) => sum + item.amount, 0)
  res.json({
    rows,
    outstanding: total("outstanding"),
    collected: total("collected"),
    waived: total("waived"),
    students: new Set(
      rows.filter((item) => item.status === "outstanding").map((item) => item.user._id),
    ).size,
  })
})

adminRoutes.post("/fines/:loanId/settle", async (req, res) => {
  const action = req.body?.action
  if (action !== "collected" && action !== "waived") fail("Choose whether to collect or waive.")
  await settleFine(req.params.loanId, action, req.body?.reason)
  res.status(204).end()
})

/* ---------- Settings ---------- */

adminRoutes.put("/settings", async (req, res) => {
  res.json(await saveSettings(req.body ?? {}))
})
