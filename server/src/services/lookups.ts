import type { ClientSession } from "mongoose"
import { Books, Copies, Users } from "../models"
import type { Book, Copy, User } from "../types"

export const DAY = 24 * 60 * 60 * 1000
export const HOUR = 60 * 60 * 1000

export const iso = (ms: number) => new Date(ms).toISOString()

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
export const contains = (q: string) => new RegExp(escapeRegex(q), "i")

/** Matches books whose ISBN, ignoring hyphens, contains `digits`. */
export const isbnContains = (q: string) => ({
  $expr: {
    $regexMatch: {
      input: { $replaceAll: { input: "$isbn", find: "-", replacement: "" } },
      regex: escapeRegex(q.replace(/-/g, "")),
    },
  },
})

export const isToday = (value: string | null) =>
  Boolean(value) && new Date(value!).toDateString() === new Date().toDateString()

export async function bookById(id: string, session?: ClientSession) {
  return Books.findById(id).session(session ?? null).lean<Book>()
}

export async function userById(id: string) {
  return Users.findById(id).lean<User>()
}

export async function copyById(id: string | null) {
  return id ? Copies.findById(id).lean<Copy>() : null
}

async function byIds<T extends { _id: string }>(
  find: (ids: string[]) => Promise<T[]>,
  ids: Array<string | null>,
): Promise<Map<string, T>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  const rows = unique.length ? await find(unique) : []
  return new Map(rows.map((row) => [row._id, row]))
}

export const booksMap = (ids: Array<string | null>) =>
  byIds((ids) => Books.find({ _id: { $in: ids } }).lean<Book[]>(), ids)
export const usersMap = (ids: Array<string | null>) =>
  byIds((ids) => Users.find({ _id: { $in: ids } }).lean<User[]>(), ids)
export const copiesMap = (ids: Array<string | null>) =>
  byIds((ids) => Copies.find({ _id: { $in: ids } }).lean<Copy[]>(), ids)

/** Map.get that treats a dangling reference as a server bug, not a missing row. */
export function must<T>(map: Map<string, T>, id: string | null): T {
  const row = id ? map.get(id) : undefined
  if (!row) throw new Error(`Missing referenced document ${id}`)
  return row
}
