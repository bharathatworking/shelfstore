import type {
  ActivityEvent,
  Book,
  BookRequest,
  Copy,
  CopyStatus,
  FinePayment,
  Loan,
  Settings,
  User,
} from "@/types"

/*
 * All data access goes through the ShelfStore API (see server/). Business
 * rules — eligibility, holds, fines, copy counts — are enforced there; these
 * functions only call it. Failures reject with an Error carrying the server's
 * message, just as the mock did.
 */

const API_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}/api`
const DAY = 24 * 60 * 60 * 1000

/** JWT for the signed-in member. Kept in memory only, like the session itself. */
let token: string | null = null

/** Last settings seen, so dueDateIfIssuedNow() can stay synchronous. */
let cachedSettings: Settings | null = null

type QueryValue = string | number | boolean | string[] | undefined

/** Builds a path, URI-encoding each interpolated id. */
function path(strings: TemplateStringsArray, ...ids: string[]): string {
  return strings.reduce(
    (out, part, i) => out + part + (i < ids.length ? encodeURIComponent(ids[i]) : ""),
    "",
  )
}

function withQuery(url: string, query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
    else params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_URL + url, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error("Can't reach the library server. Check your connection and try again.")
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? "Something went wrong. Please try again.")
  return data as T
}

const get = <T>(url: string, query?: Record<string, QueryValue>) =>
  request<T>("GET", withQuery(url, query))
const post = <T>(url: string, body: unknown = {}) => request<T>("POST", url, body)
const patch = <T>(url: string, body: unknown) => request<T>("PATCH", url, body)
const put = <T>(url: string, body: unknown) => request<T>("PUT", url, body)

function remember<T extends Settings>(settings: T): T {
  cachedSettings = settings
  return settings
}

/* ---------- Auth ---------- */

interface Session {
  token: string
  user: User
}

function startSession(session: Session): User {
  token = session.token
  getSettings().catch(() => undefined)
  return session.user
}

export async function login(email: string, password?: string): Promise<User> {
  return startSession(await post<Session>("/auth/login", { email, password }))
}

export async function signup(input: {
  name: string
  email: string
  usn: string
}): Promise<User> {
  return startSession(await post<Session>("/auth/signup", input))
}

export async function requestPasswordReset(email: string): Promise<void> {
  return post("/auth/password-reset", { email })
}

export async function getUser(userId: string): Promise<User | null> {
  return get(path`/users/${userId}`)
}

export async function getSettings(): Promise<Settings> {
  return remember(await get<Settings>("/settings"))
}

/* ---------- Catalogue ---------- */

export interface GenreSummary {
  name: string
  count: number
}

export const GENRES = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Mathematics",
  "Fiction",
  "Competitive Exams",
  "Reference",
]

export async function getGenres(): Promise<GenreSummary[]> {
  return get("/genres")
}

export async function getLanguages(): Promise<string[]> {
  return get("/languages")
}

export async function getNewArrivals(limit = 10): Promise<Book[]> {
  return get("/books/new", { limit })
}

export async function getMostBorrowed(limit = 10): Promise<Book[]> {
  return get("/books/popular", { limit })
}

export type SortKey = "relevance" | "title" | "newest" | "available"

export interface SearchParams {
  q?: string
  genres?: string[]
  language?: string
  availableOnly?: boolean
  sort?: SortKey
}

export async function searchBooks(params: SearchParams): Promise<Book[]> {
  return get("/books/search", {
    q: params.q,
    genres: params.genres,
    language: params.language,
    availableOnly: params.availableOnly || undefined,
    sort: params.sort,
  })
}

/* ---------- Book detail ---------- */

export type BookAction =
  | { kind: "available" }
  | { kind: "waitlist" }
  | {
      kind: "requested"
      status: "pending" | "approved"
      holdExpiresAt: string | null
    }
  | { kind: "borrowed"; dueDate: string }
  | { kind: "blocked"; reason: string }

export interface BookDetail {
  book: Book
  copies: Copy[]
  action: BookAction
  saved: boolean
}

export async function getBookDetail(
  userId: string,
  bookId: string,
): Promise<BookDetail | null> {
  return get(path`/users/${userId}/books/${bookId}`)
}

/* ---------- Requests ---------- */

export interface RequestOutcome {
  request: BookRequest
  book: Book
}

export async function requestBook(
  userId: string,
  bookId: string,
): Promise<RequestOutcome> {
  return post(path`/users/${userId}/requests`, { bookId })
}

export async function cancelRequest(
  userId: string,
  requestId: string,
): Promise<void> {
  return post(path`/users/${userId}/requests/${requestId}/cancel`)
}

/* ---------- Loans ---------- */

export interface LoanView extends Loan {
  book: Book
  daysOverdue: number
  fine: number
  dueSoon: boolean
  renewBlockedReason: string | null
}

export async function renewLoan(
  userId: string,
  loanId: string,
): Promise<LoanView> {
  return post(path`/users/${userId}/loans/${loanId}/renew`)
}

/* ---------- My books ---------- */

export interface RequestView extends BookRequest {
  book: Book
}

export interface HistoryEntry {
  _id: string
  book: Book
  kind: "loan" | "request"
  status: "returned" | "lost" | "rejected" | "expired" | "cancelled"
  date: string
  note: string | null
}

export interface MyBooks {
  active: LoanView[]
  requests: RequestView[]
  history: HistoryEntry[]
  totalFines: number
  limit: number
}

export async function getMyBooks(userId: string): Promise<MyBooks> {
  return get(path`/users/${userId}/my-books`)
}

export interface Alerts {
  overdue: number
  dueSoon: number
  readyToCollect: number
}

export async function getAlerts(userId: string): Promise<Alerts> {
  return get(path`/users/${userId}/alerts`)
}

/* ---------- Saved ---------- */

export async function getSavedBooks(userId: string): Promise<Book[]> {
  return get(path`/users/${userId}/saved`)
}

export async function toggleSaved(
  userId: string,
  bookId: string,
): Promise<boolean> {
  return post(path`/users/${userId}/saved/${bookId}/toggle`)
}

/* ---------- Profile ---------- */

export interface ProfileSummary {
  user: User
  activeCount: number
  holdCount: number
  totalBorrowed: number
  totalFines: number
  settings: Settings
}

export async function getProfile(
  userId: string,
): Promise<ProfileSummary | null> {
  const profile = await get<ProfileSummary | null>(path`/users/${userId}/profile`)
  if (profile) remember(profile.settings)
  return profile
}

export async function updateProfile(
  userId: string,
  input: { name: string; email: string },
): Promise<User> {
  return patch(path`/users/${userId}`, input)
}

export interface LoanDetail {
  loan: LoanView
  copy: Copy
  requestedAt: string | null
  collectedAt: string
}

export async function getLoanDetail(
  userId: string,
  loanId: string,
): Promise<LoanDetail | null> {
  return get(path`/users/${userId}/loans/${loanId}`)
}

export interface FineItem {
  _id: string
  loan: Loan
  user: User
  book: Book
  amount: number
  status: "outstanding" | "collected" | "waived"
  date: string
  reason: string | null
}

export async function getMyFines(
  userId: string,
): Promise<{
  balance: number
  items: FineItem[]
  settings: Settings
}> {
  const fines = await get<{ balance: number; items: FineItem[]; settings: Settings }>(
    path`/users/${userId}/fines`,
  )
  remember(fines.settings)
  return fines
}

export interface MemberNotification {
  _id: string
  title: string
  description: string
  at: string
  to: string
  read: boolean
}

export async function getNotifications(
  userId: string,
): Promise<MemberNotification[]> {
  return get(path`/users/${userId}/notifications`)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  return post(path`/users/${userId}/notifications/read`)
}

/* =====================================================================
 * Librarian
 * ===================================================================== */

export type ReturnCondition = "good" | "fair" | "poor" | "damaged"

/** Due date for a loan issued right now. */
export const dueDateIfIssuedNow = () =>
  new Date(
    Date.now() + (cachedSettings?.loanPeriodDays ?? 14) * DAY,
  ).toISOString()

export interface AdminStats {
  activeLoans: number
  overdue: number
  pendingRequests: number
  dueToday: number
}

export async function getAdminStats(): Promise<AdminStats> {
  return get("/admin/stats")
}

/* ---------- Requests queue ---------- */

export type QueueTab = "pending" | "approved" | "rejected"

export interface AdminRequestView {
  request: BookRequest
  user: User
  book: Book
  copy: Copy | null
  flagReason: string | null
}

export async function getRequestCounts(): Promise<Record<QueueTab, number>> {
  return get("/admin/requests/counts")
}

export async function listRequests(
  status: QueueTab,
  limit?: number,
): Promise<AdminRequestView[]> {
  return get("/admin/requests", { status, limit })
}

export async function approveRequest(
  requestId: string,
): Promise<AdminRequestView> {
  return post(path`/admin/requests/${requestId}/approve`)
}

export async function rejectRequest(
  requestId: string,
  reason: string,
): Promise<void> {
  return post(path`/admin/requests/${requestId}/reject`, { reason })
}

/* ---------- Collect hold ---------- */

export interface HoldMatch {
  request: BookRequest
  user: User
  book: Book
  copy: Copy
}

export type HoldLookup =
  | { kind: "found"; holds: HoldMatch[] }
  | {
      kind: "expired"
      hold: HoldMatch
    }
  | { kind: "not_found"; user: User | null }

export async function findHold(code: string): Promise<HoldLookup> {
  return get("/admin/holds", { code })
}

export async function collectHold(requestId: string): Promise<Loan> {
  return post(path`/admin/holds/${requestId}/collect`)
}

/* ---------- Direct issue ---------- */

export interface Eligibility {
  booksOut: number
  limit: number
  fines: number
  threshold: number
  status: User["status"]
  checks: { books: boolean; fines: boolean; account: boolean }
  eligible: boolean
}

export async function getEligibility(userId: string): Promise<Eligibility> {
  return get(path`/admin/members/${userId}/eligibility`)
}

export async function findMembers(query: string): Promise<User[]> {
  return get("/admin/members/search", { q: query })
}

export interface AdminMemberRow {
  user: User
  booksOut: number
  fines: number
}

export async function listAdminMembers(input: {
  q?: string
  status?: "all" | User["status"]
}): Promise<AdminMemberRow[]> {
  return get("/admin/members", input)
}

export interface AdminMemberDetail {
  user: User
  active: LoanView[]
  history: LoanView[]
  fines: FineItem[]
  stats: {
    active: number
    holds: number
    totalBorrowed: number
    fines: number
  }
}

export async function getAdminMember(
  userId: string,
): Promise<AdminMemberDetail | null> {
  return get(path`/admin/members/${userId}`)
}

export async function setMemberStatus(
  userId: string,
  status: User["status"],
): Promise<User> {
  return patch(path`/admin/members/${userId}/status`, { status })
}

export async function forceReturnLoan(loanId: string): Promise<void> {
  return post(path`/admin/loans/${loanId}/force-return`)
}

export interface FineLedger {
  rows: FineItem[]
  outstanding: number
  collected: number
  waived: number
  students: number
}

export async function listFines(days?: number): Promise<FineLedger> {
  return get("/admin/fines", { days })
}

export async function settleFine(
  loanId: string,
  action: "collected" | "waived",
  reason?: string,
): Promise<void> {
  return post(path`/admin/fines/${loanId}/settle`, { action, reason })
}

export async function updateSettings(input: Settings): Promise<Settings> {
  return remember(await put<Settings>("/admin/settings", input))
}

export async function getAdminBook(bookId: string): Promise<Book | null> {
  return get(path`/admin/books/${bookId}`)
}

export interface AdminBookInput {
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
  copies?: number
}

export interface AdminBookPage {
  rows: Book[]
  total: number
  page: number
  pageSize: number
  pages: number
}

export async function listAdminBooks(input: {
  q?: string
  genre?: string
  availability?: "all" | "available" | "unavailable"
  page?: number
  pageSize?: number
}): Promise<AdminBookPage> {
  return get("/admin/books", input)
}

export async function isDuplicateIsbn(
  isbn: string,
  exceptBookId?: string,
): Promise<boolean> {
  return get("/admin/books/isbn-exists", { isbn, exceptBookId })
}

export async function lookupIsbn(isbn: string): Promise<AdminBookInput> {
  return get("/admin/books/isbn-lookup", { isbn })
}

export async function createAdminBook(input: AdminBookInput): Promise<Book> {
  return post("/admin/books", input)
}

export async function updateAdminBook(
  bookId: string,
  input: AdminBookInput,
): Promise<Book> {
  return put(path`/admin/books/${bookId}`, input)
}

export async function archiveAdminBooks(bookIds: string[]): Promise<void> {
  return post("/admin/books/archive", { bookIds })
}

export interface AdminCopyView {
  copy: Copy
  holder: User | null
}

export async function listAdminCopies(
  bookId: string,
): Promise<AdminCopyView[]> {
  return get(path`/admin/books/${bookId}/copies`)
}

export async function addAdminCopy(bookId: string): Promise<Copy> {
  return post(path`/admin/books/${bookId}/copies`)
}

export async function updateAdminCopy(
  copyId: string,
  patchInput: {
    condition?: Copy["condition"]
    status?: CopyStatus
  },
): Promise<Copy> {
  return patch(path`/admin/copies/${copyId}`, patchInput)
}

export async function getCopiesForBook(bookId: string): Promise<Copy[]> {
  return get(path`/admin/books/${bookId}/copy-list`)
}

export async function directIssue(
  userId: string,
  copyId: string,
  overrideReason?: string,
): Promise<Loan> {
  return post("/admin/issue", { userId, copyId, overrideReason })
}

/* ---------- Return ---------- */

export interface ReturnMatch {
  loan: Loan
  user: User
  book: Book
  copy: Copy
  daysOverdue: number
  fine: number
  finePerDay: number
}

export async function findLoanByBarcode(
  barcode: string,
): Promise<ReturnMatch | null> {
  return get("/admin/returns/find", { barcode })
}

export async function returnLoan(
  loanId: string,
  input: {
    condition: ReturnCondition
    fineAction?: "collected" | "waived"
    waiveReason?: string
  },
): Promise<void> {
  return post(path`/admin/loans/${loanId}/return`, input)
}

export interface ReturnedToday {
  loan: Loan
  user: User
  book: Book
  copy: Copy
  payment: FinePayment | null
}

export async function getTodaysReturns(): Promise<ReturnedToday[]> {
  return get("/admin/returns/today")
}

/* ---------- Overdue ---------- */

export interface OverdueRow {
  loan: Loan
  user: User
  book: Book
  copy: Copy
  daysOverdue: number
  fine: number
  lastRemindedAt: string | null
}

export async function getOverdue(): Promise<OverdueRow[]> {
  return get("/admin/overdue")
}

export async function sendReminders(loanIds: string[]): Promise<number> {
  return post("/admin/reminders", { loanIds })
}

/* ---------- Dashboard ---------- */

export interface DayCount {
  date: string
  count: number
}

export async function getBorrowsByDay(days = 7): Promise<DayCount[]> {
  return get("/admin/borrows-by-day", { days })
}

export interface ActivityView extends ActivityEvent {
  userName: string
  bookTitle: string
}

export async function getActivity(limit = 8): Promise<ActivityView[]> {
  return get("/admin/activity", { limit })
}

/* ---------- Global search ---------- */

export interface AdminSearchResult {
  members: User[]
  books: Book[]
  copies: Array<{ copy: Copy; book: Book; state: "loan" | "hold" | "shelf" }>
}

export async function adminSearch(query: string): Promise<AdminSearchResult> {
  return get("/admin/search", { q: query })
}
