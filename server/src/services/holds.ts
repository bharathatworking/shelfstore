import { withTxn } from "../db"
import { Requests } from "../models"
import { releaseHeldCopy } from "./copies"

/** Approved holds past holdExpiresAt become expired and release their copy. */
export async function releaseExpiredHolds() {
  const now = new Date().toISOString()
  const expired = await Requests.find(
    { status: "approved", holdExpiresAt: { $lt: now } },
    { _id: 1, copyId: 1 },
  ).lean<Array<{ _id: string; copyId: string | null }>>()
  for (const hold of expired) {
    await withTxn(async (session) => {
      const { modifiedCount } = await Requests.updateOne(
        { _id: hold._id, status: "approved" },
        { $set: { status: "expired" } },
        { session },
      )
      if (modifiedCount && hold.copyId) await releaseHeldCopy(hold.copyId, session)
    })
  }
}
