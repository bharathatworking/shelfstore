import { Router } from "express"
import type { ClientSession, FilterQuery } from "mongoose"
import { newId, withTxn } from "../db"
import { fail } from "../errors"
import { int, text } from "../middleware/query"
import { Books, Copies, Loans } from "../models"
import { insertCopy, transitionCopy } from "../services/copies"
import { bookById, contains, usersMap } from "../services/lookups"
import type { Book, Copy, CopyStatus, Loan } from "../types"
import { COPY_ORDER } from "./member"

/** Catalogue management under /api/admin. Mounted behind requireAuth + requireAdmin. */
export const adminBookRoutes = Router()

const BOOK_FIELDS = [
  "title",
  "authors",
  "isbn",
  "genres",
  "publisher",
  "year",
  "language",
  "description",
  "shelfLocation",
  "coverColor",
] as const

type BookDetails = Pick<Book, (typeof BOOK_FIELDS)[number]>

function bookDetails(body: Record<string, unknown>): BookDetails {
  const details = {} as Record<string, unknown>
  for (const key of BOOK_FIELDS) details[key] = body?.[key]
  return details as BookDetails
}

/** Same ISBN ignoring hyphens, on any other book (archived ones included). */
async function isDuplicateIsbn(isbn: string, exceptBookId?: string) {
  const digits = isbn.replace(/-/g, "").trim()
  return Boolean(
    await Books.exists({
      ...(exceptBookId ? { _id: { $ne: exceptBookId } } : {}),
      $expr: {
        $eq: [{ $replaceAll: { input: "$isbn", find: "-", replacement: "" } }, digits],
      },
    }),
  )
}

async function nextBarcode(session: ClientSession): Promise<string> {
  const last = await Copies.findOne({ barcode: /^SS-\d{5}$/ }, { barcode: 1 })
    .sort({ barcode: -1 })
    .session(session)
    .lean<Copy>()
  const next = (Number(last?.barcode.replace(/\D/g, "")) || 0) + 1
  return `SS-${String(next).padStart(5, "0")}`
}

async function addCopyRecord(bookId: string, session: ClientSession): Promise<Copy> {
  const count = await Copies.countDocuments({ bookId }).session(session)
  const copy: Copy = {
    _id: `${bookId}-c${count + 1}-${Date.now().toString(36)}`,
    bookId,
    barcode: await nextBarcode(session),
    condition: "good",
    status: "available",
    addedAt: new Date().toISOString(),
  }
  await insertCopy(copy, session)
  return copy
}

adminBookRoutes.get("/books", async (req, res) => {
  const q = text(req, "q")?.trim() ?? ""
  const genre = text(req, "genre")
  const availability = text(req, "availability")
  const pageSize = int(req, "pageSize") ?? 10

  const filter: FilterQuery<Book> = { archived: { $ne: true } }
  if (q)
    filter.$or = ["title", "authors", "isbn", "shelfLocation"].map((field) => ({
      [field]: contains(q),
    }))
  if (genre) filter.genres = genre
  if (availability === "available") filter.availableCopies = { $gt: 0 }
  if (availability === "unavailable") filter.availableCopies = 0

  const total = await Books.countDocuments(filter)
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(int(req, "page") ?? 1, 1), pages)
  const rows = await Books.find(filter)
    .collation({ locale: "en" })
    .sort({ title: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean<Book[]>()
  res.json({ rows, total, page, pageSize, pages })
})

adminBookRoutes.get("/books/isbn-exists", async (req, res) => {
  res.json(await isDuplicateIsbn(text(req, "isbn") ?? "", text(req, "exceptBookId")))
})

/** Stand-in for a real ISBN service; returns the same sample record as the mock. */
adminBookRoutes.get("/books/isbn-lookup", async (req, res) => {
  const isbn = text(req, "isbn")?.trim() ?? ""
  if (!isbn) fail("Enter an ISBN to look up.")
  res.json({
    title: "Clean Architecture",
    authors: ["Robert C. Martin"],
    isbn,
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
})

adminBookRoutes.post("/books/archive", async (req, res) => {
  const ids: string[] = Array.isArray(req.body?.bookIds) ? req.body.bookIds.map(String) : []
  await Books.updateMany({ _id: { $in: ids } }, { $set: { archived: true } })
  res.status(204).end()
})

adminBookRoutes.get("/books/:id", async (req, res) => {
  res.json(await bookById(req.params.id))
})

adminBookRoutes.post("/books", async (req, res) => {
  const details = bookDetails(req.body)
  if (await isDuplicateIsbn(String(details.isbn ?? "")))
    fail("A book with this ISBN already exists.", 409)
  const copyCount = Math.max(0, Math.min(Number(req.body?.copies) || 0, 100))
  const bookId = newId("b")
  await withTxn(async (session) => {
    await Books.create(
      [{ _id: bookId, ...details, totalCopies: 0, availableCopies: 0, archived: false }],
      { session },
    )
    for (let i = 0; i < copyCount; i++) await addCopyRecord(bookId, session)
  })
  res.status(201).json(await bookById(bookId))
})

adminBookRoutes.put("/books/:id", async (req, res) => {
  const bookId = req.params.id
  if (!(await Books.exists({ _id: bookId }))) fail("Book not found.", 404)
  const details = bookDetails(req.body)
  if (await isDuplicateIsbn(String(details.isbn ?? ""), bookId))
    fail("A book with this ISBN already exists.", 409)
  const book = await Books.findByIdAndUpdate(
    bookId,
    { $set: details },
    { new: true, runValidators: true },
  ).lean<Book>()
  res.json(book)
})

adminBookRoutes.get("/books/:id/copies", async (req, res) => {
  const copies = await Copies.find({ bookId: req.params.id }).sort(COPY_ORDER).lean<Copy[]>()
  const loans = await Loans.find({
    copyId: { $in: copies.map((c) => c._id) },
    status: "active",
  }).lean<Loan[]>()
  const holders = await usersMap(loans.map((l) => l.userId))
  const holderOf = new Map(loans.map((l) => [l.copyId, holders.get(l.userId) ?? null]))
  res.json(copies.map((copy) => ({ copy, holder: holderOf.get(copy._id) ?? null })))
})

adminBookRoutes.get("/books/:id/copy-list", async (req, res) => {
  res.json(await Copies.find({ bookId: req.params.id }).sort(COPY_ORDER).lean<Copy[]>())
})

adminBookRoutes.post("/books/:id/copies", async (req, res) => {
  const bookId = req.params.id
  if (!(await Books.exists({ _id: bookId }))) fail("Book not found.", 404)
  res.status(201).json(await withTxn((session) => addCopyRecord(bookId, session)))
})

const CONDITIONS = ["good", "fair", "poor"]
const STATUSES = ["available", "on_hold", "borrowed", "damaged", "lost", "retired"]

adminBookRoutes.patch("/copies/:id", async (req, res) => {
  const copyId = req.params.id
  const status: CopyStatus | undefined = req.body?.status
  const condition: Copy["condition"] | undefined = req.body?.condition
  if (status !== undefined && !STATUSES.includes(status)) fail("Choose a valid status.")
  if (condition !== undefined && !CONDITIONS.includes(condition)) fail("Choose a valid condition.")
  const updated = await withTxn(async (session) => {
    const copy = await Copies.findById(copyId).session(session).lean<Copy>()
    if (!copy) fail("Copy not found.", 404)
    if (status === "retired" && copy.status === "borrowed")
      fail("A borrowed copy cannot be retired until it is returned.")
    const next = await transitionCopy(
      { _id: copyId, status: copy.status },
      status ?? copy.status,
      session,
      condition ? { condition } : {},
    )
    if (!next) fail("This copy changed while saving. Please try again.", 409)
    return next
  })
  res.json(updated)
})

