import { Router } from "express"
import type { FilterQuery } from "mongoose"
import { int, list, text } from "../middleware/query"
import { Books, Loans } from "../models"
import { booksMap, contains, DAY, escapeRegex, isbnContains, iso } from "../services/lookups"
import { getSettings } from "../services/settings"
import type { Book } from "../types"

export const GENRES = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Mathematics",
  "Fiction",
  "Competitive Exams",
  "Reference",
]

const notArchived = { archived: { $ne: true } }

/** Read-only catalogue routes. Public, since they expose nothing about members. */
export const catalogueRoutes = Router()

catalogueRoutes.get("/settings", async (_req, res) => {
  res.json(await getSettings())
})

catalogueRoutes.get("/genres", async (_req, res) => {
  const rows = await Books.aggregate<{ _id: string; count: number }>([
    { $unwind: "$genres" },
    { $group: { _id: "$genres", count: { $sum: 1 } } },
  ])
  const counts = new Map(rows.map((row) => [row._id, row.count]))
  res.json(GENRES.map((name) => ({ name, count: counts.get(name) ?? 0 })))
})

catalogueRoutes.get("/languages", async (_req, res) => {
  const languages: string[] = await Books.distinct("language")
  res.json(languages.sort())
})

catalogueRoutes.get("/books/new", async (req, res) => {
  res.json(
    await Books.find(notArchived)
      .sort({ year: -1, _id: 1 })
      .limit(int(req, "limit") ?? 10)
      .lean<Book[]>(),
  )
})

catalogueRoutes.get("/books/popular", async (req, res) => {
  const ranked = await Loans.aggregate<{ _id: string }>([
    { $match: { issuedAt: { $gte: iso(Date.now() - 30 * DAY) } } },
    { $group: { _id: "$bookId", count: { $sum: 1 }, first: { $min: "$_id" } } },
    { $sort: { count: -1, first: 1 } },
  ])
  const books = await booksMap(ranked.map((row) => row._id))
  res.json(
    ranked
      .map((row) => books.get(row._id))
      .filter((book): book is Book => Boolean(book) && !book!.archived)
      .slice(0, int(req, "limit") ?? 10),
  )
})

type SortKey = "relevance" | "title" | "newest" | "available"

catalogueRoutes.get("/books/search", async (req, res) => {
  const q = text(req, "q")?.trim().toLowerCase() ?? ""
  const genres = list(req, "genres")
  const language = text(req, "language")
  const sort = (text(req, "sort") ?? "relevance") as SortKey

  const filter: FilterQuery<Book> = { ...notArchived }
  if (genres.length) filter.genres = { $in: genres }
  if (language) filter.language = language
  if (text(req, "availableOnly") === "true") filter.availableCopies = { $gt: 0 }
  if (q)
    filter.$or = [
      { title: contains(q) },
      { authors: contains(q) },
      { genres: contains(q) },
      { publisher: contains(q) },
      { shelfLocation: new RegExp(`^${escapeRegex(q)}$`, "i") },
      isbnContains(q),
    ]
  const books = await Books.find(filter).sort({ _id: 1 }).lean<Book[]>()

  // Relevance scoring is unchanged from the mock, so results rank the same.
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
  const result = books
    .map((book) => ({ book, score: score(book) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (sort === "title") return a.book.title.localeCompare(b.book.title)
      if (sort === "newest") return b.book.year - a.book.year
      if (sort === "available") return b.book.availableCopies - a.book.availableCopies
      return b.score - a.score || a.book.title.localeCompare(b.book.title)
    })
  res.json(result.map((r) => r.book))
})
