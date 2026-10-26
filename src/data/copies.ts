import type { Copy, CopyStatus } from "@/types"
import { books } from "./books"

/** Copy ids follow `<bookId>-c<n>`; seeded loans and holds below reference them. */
const seededStatus: Record<string, CopyStatus> = {
  "b001-c1": "borrowed",
  "b002-c1": "borrowed",
  "b033-c1": "borrowed",
  "b020-c3": "borrowed",
  "b003-c1": "on_hold",
  "b014-c1": "borrowed",
  "b014-c2": "borrowed",
  "b026-c1": "borrowed",
  "b043-c1": "borrowed",
  "b015-c2": "borrowed",
  "b042-c1": "borrowed",
  "b028-c1": "borrowed",
  "b004-c2": "borrowed",
  "b013-c3": "borrowed",
  "b006-c1": "borrowed",
  "b006-c2": "damaged",
  "b010-c4": "damaged",
  "b022-c5": "lost",
  "b031-c4": "damaged",
}

let serial = 101

export const copies: Copy[] = books.flatMap((book) =>
  Array.from({ length: book.totalCopies }, (_, i) => {
    const _id = `${book._id}-c${i + 1}`
    const status = seededStatus[_id] ?? "available"
    const condition: Copy["condition"] =
      status === "damaged" ? "poor" : i % 3 === 2 ? "fair" : "good"
    return {
      _id,
      bookId: book._id,
      barcode: `SS-${String(serial++).padStart(5, "0")}`,
      condition,
      status,
      addedAt: new Date(Date.UTC(2023, 6, 1 + serial)).toISOString(),
    }
  }),
)
