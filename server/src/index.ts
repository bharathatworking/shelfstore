import "dotenv/config"
import cors from "cors"
import express from "express"
import { connect } from "./db"
import { errorHandler } from "./errors"
import { requireAdmin, requireAuth } from "./middleware/auth"
import { adminRoutes } from "./routes/admin"
import { adminBookRoutes } from "./routes/adminBooks"
import { authRoutes } from "./routes/auth"
import { catalogueRoutes } from "./routes/catalogue"
import { memberRoutes } from "./routes/member"
import { releaseExpiredHolds } from "./services/holds"

const isDev = process.env.NODE_ENV !== "production"
const configuredOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = new Set(["http://localhost:5173", ...configuredOrigins])
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

const app = express()

// First, so preflight requests are answered (204) before any auth or route runs.
app.use(
  cors({
    // Listed origins, plus any localhost port in development. Requests without
    // an Origin header (curl, server-to-server) aren't subject to CORS.
    origin: (origin, callback) =>
      callback(
        null,
        !origin || allowedOrigins.has(origin) || (isDev && LOCALHOST.test(origin)),
      ),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    optionsSuccessStatus: 204,
  }),
)
app.use(express.json())

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})
app.use("/api/auth", authRoutes)

// Expire overdue holds and free their copies before any route reads circulation state.
app.use("/api", async (_req, _res, next) => {
  await releaseExpiredHolds()
  next()
})

app.use("/api", catalogueRoutes)
app.use("/api/users", requireAuth, memberRoutes)
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes, adminBookRoutes)
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found." })
})
app.use(errorHandler)

const port = Number(process.env.PORT) || 4000
await connect()
app.listen(port, () => {
  console.log(`ShelfStore API listening on http://localhost:${port}`)
})
