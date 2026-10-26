import type { RequestHandler, Response } from "express"
import jwt, { type JwtPayload } from "jsonwebtoken"
import { fail } from "../errors"
import type { Role, User } from "../types"

export interface Auth {
  userId: string
  role: Role
}

function secret(): string {
  const value = process.env.JWT_SECRET
  if (!value) throw new Error("JWT_SECRET is not set. Copy server/.env.example to server/.env.")
  return value
}

export const signToken = (user: User) =>
  jwt.sign({ role: user.role }, secret(), { subject: user._id, expiresIn: "12h" })

export const authOf = (res: Response) => res.locals.auth as Auth

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.get("authorization") ?? ""
  if (!header.startsWith("Bearer ")) fail("Please sign in to continue.", 401)
  let payload: JwtPayload
  try {
    payload = jwt.verify(header.slice(7), secret()) as JwtPayload
  } catch {
    fail("Your session has expired. Please sign in again.", 401)
  }
  res.locals.auth = { userId: payload.sub!, role: payload.role } satisfies Auth
  next()
}

export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (authOf(res).role !== "admin") fail("You do not have access to this page.", 403)
  next()
}

/** Members may only touch their own :userId routes; librarians may touch any. */
export const selfOrAdmin = (res: Response, userId: string) => {
  const auth = authOf(res)
  if (auth.role !== "admin" && auth.userId !== userId)
    fail("You do not have access to this member.", 403)
}
