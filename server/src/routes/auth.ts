import { Router } from "express"
import { newId } from "../db"
import { fail } from "../errors"
import { signToken } from "../middleware/auth"
import { Users } from "../models"
import type { User } from "../types"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const authRoutes = Router()

/** Demo login: any valid email with a 6+ character password; unknown emails get an account. */
authRoutes.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase()
  const password = String(req.body?.password ?? "")
  if (!EMAIL_RE.test(email)) fail("Enter a valid email, like name@vvce.ac.in")
  if (password.length < 6) fail("Your password must be at least 6 characters.")

  let user = await Users.findOne({ email }).lean<User>()
  if (!user) {
    const local = email.split("@")[0].replace(/[._-]+/g, " ")
    const created: User = {
      _id: newId("u"),
      name: local.replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      usn: null,
      role: email.includes("admin") ? "admin" : "student",
      status: "active",
      joinedAt: new Date().toISOString(),
    }
    try {
      await Users.create(created)
      user = created
    } catch (err) {
      // Two first logins raced; the other one created the account.
      if ((err as { code?: number }).code !== 11000) throw err
      user = await Users.findOne({ email }).lean<User>()
    }
  }
  res.json({ token: signToken(user!), user })
})

authRoutes.post("/signup", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase()
  const usn = String(req.body?.usn ?? "").trim().toUpperCase()
  if (!EMAIL_RE.test(email)) fail("Enter a valid email, like name@vvce.ac.in")
  if (await Users.exists({ email }))
    fail("An account with this email already exists. Sign in instead.", 409)
  if (usn && (await Users.exists({ usn })))
    fail("An account with this USN already exists. Sign in instead.", 409)
  const user: User = {
    _id: newId("u"),
    name: String(req.body?.name ?? "").trim(),
    email,
    usn: usn || null,
    role: "student",
    status: "active",
    joinedAt: new Date().toISOString(),
  }
  await Users.create(user)
  res.status(201).json({ token: signToken(user), user })
})

authRoutes.post("/password-reset", async (req, res) => {
  if (!String(req.body?.email ?? "").trim()) fail("Enter your college email.")
  res.status(204).end()
})
