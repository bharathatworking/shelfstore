import { model, Schema } from "mongoose"
import type {
  ActivityEvent,
  Book,
  BookRequest,
  Copy,
  FinePayment,
  Loan,
  Reminder,
  SavedBook,
  Settings,
  User,
} from "./types"

/*
 * Field names and types mirror src/types.ts exactly. Dates are stored as ISO
 * strings, as in the mock data; toISOString() output sorts and range-queries
 * correctly as a string.
 */

const opts = { versionKey: false } as const
const str = { type: String, required: true }
const nullable = { type: String, default: null }

export type UserDoc = User & { readNotifications: string[] }

const userSchema = new Schema<UserDoc>(
  {
    _id: str,
    name: str,
    email: { type: String, required: true, unique: true },
    usn: nullable,
    role: { type: String, enum: ["student", "admin"], required: true },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    joinedAt: str,
    // Ids of notifications the member has dismissed. Never sent to the client.
    readNotifications: { type: [String], default: [], select: false },
  },
  opts,
)
// "Sparse" in intent: a plain sparse index still indexes explicit nulls, and
// admins and quick-login members all have usn: null, so index strings only.
userSchema.index(
  { usn: 1 },
  { unique: true, partialFilterExpression: { usn: { $type: "string" } } },
)

const bookSchema = new Schema<Book>(
  {
    _id: str,
    title: str,
    authors: { type: [String], required: true },
    isbn: { type: String, required: true, unique: true },
    genres: { type: [String], required: true },
    publisher: str,
    year: { type: Number, required: true },
    language: str,
    description: { type: String, default: "" },
    shelfLocation: str,
    coverColor: str,
    // Kept in step with copies by services/copies.ts on every status change.
    totalCopies: { type: Number, default: 0 },
    availableCopies: { type: Number, default: 0 },
    archived: { type: Boolean, default: false },
  },
  opts,
)
// Text indexes treat a `language` field as a per-document stemming language and
// reject values Mongo doesn't know (e.g. "Kannada"), so point the override elsewhere.
bookSchema.index(
  { title: "text", authors: "text" },
  { default_language: "english", language_override: "textLanguage" },
)

const copySchema = new Schema<Copy>(
  {
    _id: str,
    bookId: str,
    barcode: { type: String, required: true, unique: true },
    condition: { type: String, enum: ["good", "fair", "poor"], required: true },
    status: {
      type: String,
      enum: ["available", "on_hold", "borrowed", "damaged", "lost", "retired"],
      required: true,
    },
    addedAt: String,
  },
  opts,
)
copySchema.index({ bookId: 1, status: 1 })

const requestSchema = new Schema<BookRequest>(
  {
    _id: str,
    userId: str,
    bookId: str,
    copyId: nullable,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired", "fulfilled"],
      required: true,
    },
    requestedAt: str,
    decidedAt: nullable,
    holdExpiresAt: nullable,
    flagReason: nullable,
    rejectReason: nullable,
  },
  opts,
)
requestSchema.index({ status: 1, requestedAt: 1 })
requestSchema.index({ holdExpiresAt: 1 })
requestSchema.index({ userId: 1, status: 1 })

const loanSchema = new Schema<Loan>(
  {
    _id: str,
    userId: str,
    bookId: str,
    copyId: str,
    issuedAt: str,
    dueDate: str,
    returnedAt: nullable,
    renewCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "returned", "lost"], required: true },
  },
  opts,
)
loanSchema.index({ status: 1, dueDate: 1 })
loanSchema.index({ userId: 1, status: 1 })
loanSchema.index({ copyId: 1, status: 1 })

const settingsSchema = new Schema<Settings & { _id: string }>(
  {
    _id: { type: String, default: "default" },
    loanPeriodDays: Number,
    maxBooksPerUser: Number,
    maxRenewals: Number,
    finePerDay: Number,
    fineBlockThreshold: Number,
    holdHours: Number,
    requireManualApproval: Boolean,
  },
  opts,
)

const activitySchema = new Schema<ActivityEvent>(
  {
    _id: str,
    type: str,
    userId: str,
    bookId: str,
    at: str,
    note: nullable,
  },
  opts,
)
activitySchema.index({ at: -1 })

const reminderSchema = new Schema<Reminder>(
  { _id: str, loanId: str, sentAt: str },
  opts,
)
reminderSchema.index({ loanId: 1 })

const savedBookSchema = new Schema<SavedBook>(
  { _id: str, userId: str, bookId: str, savedAt: str },
  opts,
)
savedBookSchema.index({ userId: 1, bookId: 1 }, { unique: true })

/** Settlements only. The fine owed is always computed from the loan's due date. */
const finePaymentSchema = new Schema<FinePayment>(
  {
    _id: str,
    loanId: str,
    amount: { type: Number, required: true },
    action: { type: String, enum: ["collected", "waived"], required: true },
    reason: nullable,
    at: str,
  },
  opts,
)
finePaymentSchema.index({ loanId: 1 })

export const Users = model("User", userSchema, "users")
export const Books = model("Book", bookSchema, "books")
export const Copies = model("Copy", copySchema, "copies")
export const Requests = model("Request", requestSchema, "requests")
export const Loans = model("Loan", loanSchema, "loans")
export const SettingsStore = model("Settings", settingsSchema, "settings")
export const Activities = model("Activity", activitySchema, "activity")
export const Reminders = model("Reminder", reminderSchema, "reminders")
export const SavedBooks = model("SavedBook", savedBookSchema, "savedBooks")
export const FinePayments = model("FinePayment", finePaymentSchema, "finePayments")

export const allModels = [
  Users,
  Books,
  Copies,
  Requests,
  Loans,
  SettingsStore,
  Activities,
  Reminders,
  SavedBooks,
  FinePayments,
]
