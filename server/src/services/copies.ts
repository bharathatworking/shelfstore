import type { ClientSession, FilterQuery } from "mongoose"
import { Books, Copies } from "../models"
import type { Copy, CopyStatus } from "../types"

/*
 * Every copy status change goes through here so books.availableCopies
 * (copies that are "available") and books.totalCopies (copies not "retired")
 * always agree with the copies collection. Callers run inside withTxn.
 */

async function adjustCounts(
  bookId: string,
  from: CopyStatus | null,
  to: CopyStatus,
  session: ClientSession,
) {
  const available = Number(to === "available") - Number(from === "available")
  const total =
    Number(to !== "retired") - Number(from !== null && from !== "retired")
  if (!available && !total) return
  await Books.updateOne(
    { _id: bookId },
    { $inc: { availableCopies: available, totalCopies: total } },
    { session },
  )
}

/**
 * Atomically sets the status of the first copy matching `filter`. Put the
 * expected current status in the filter so two callers can't both win.
 */
export async function transitionCopy(
  filter: FilterQuery<Copy>,
  to: CopyStatus,
  session: ClientSession,
  extra: Partial<Pick<Copy, "condition">> = {},
): Promise<Copy | null> {
  const before = await Copies.findOneAndUpdate(
    filter,
    { $set: { status: to, ...extra } },
    { session, sort: { _id: 1 } },
  ).lean<Copy>()
  if (!before) return null
  await adjustCounts(before.bookId, before.status, to, session)
  return { ...before, ...extra, status: to }
}

/** Claims any available copy of a book. Null when none is left. */
export const claimCopy = (bookId: string, to: CopyStatus, session: ClientSession) =>
  transitionCopy({ bookId, status: "available" }, to, session)

/** Returns a held copy to the shelf, if it is still on hold. */
export const releaseHeldCopy = (copyId: string, session: ClientSession) =>
  transitionCopy({ _id: copyId, status: "on_hold" }, "available", session)

export async function insertCopy(copy: Copy, session: ClientSession) {
  await Copies.create([copy], { session })
  await adjustCounts(copy.bookId, null, copy.status, session)
}
