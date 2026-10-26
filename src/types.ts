export type Role = "student" | "admin"

export interface User {
  _id: string
  name: string
  email: string
  usn: string | null
  role: Role
  status: "active" | "suspended"
  joinedAt: string
}

export interface Book {
  _id: string
  title: string
  authors: string[]
  isbn: string
  genres: string[]
  publisher: string
  year: number
  language: string
  description: string
  shelfLocation: string
  coverColor: string
  totalCopies: number
  availableCopies: number
  archived?: boolean
}

export type CopyStatus = "available" | "on_hold" | "borrowed" | "damaged" | "lost" | "retired"

export interface Copy {
  _id: string
  bookId: string
  barcode: string
  condition: "good" | "fair" | "poor"
  status: CopyStatus
  addedAt?: string
}

export type RequestStatus = "pending" | "approved" | "rejected" | "expired" | "fulfilled"

export interface BookRequest {
  _id: string
  userId: string
  bookId: string
  copyId: string | null
  status: RequestStatus
  requestedAt: string
  decidedAt: string | null
  holdExpiresAt: string | null
  flagReason: string | null
  rejectReason: string | null
}

export interface Loan {
  _id: string
  userId: string
  bookId: string
  copyId: string
  issuedAt: string
  dueDate: string
  returnedAt: string | null
  renewCount: number
  status: "active" | "returned" | "lost"
}

export interface Settings {
  loanPeriodDays: number
  maxBooksPerUser: number
  maxRenewals: number
  finePerDay: number
  fineBlockThreshold: number
  holdHours: number
  requireManualApproval: boolean
}

export interface SavedBook {
  _id: string
  userId: string
  bookId: string
  savedAt: string
}

export type ActivityType = "collected" | "issued" | "returned" | "requested" | "approved" | "rejected" | "reminded"

export interface ActivityEvent {
  _id: string
  type: ActivityType
  userId: string
  bookId: string
  at: string
  note: string | null
}

export interface Reminder {
  _id: string
  loanId: string
  sentAt: string
}

export interface FinePayment {
  _id: string
  loanId: string
  amount: number
  action: "collected" | "waived"
  reason: string | null
  at: string
}
