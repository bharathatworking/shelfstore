import mongoose, { type ClientSession } from "mongoose"

export async function connect() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not set. Copy server/.env.example to server/.env.")
  await mongoose.connect(uri)
}

/** Runs fn in a transaction (Atlas clusters are replica sets, so this is always available). */
export async function withTxn<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession()
  try {
    let result!: T
    await session.withTransaction(async () => {
      result = await fn(session)
    })
    return result
  } finally {
    await session.endSession()
  }
}

export const newId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
