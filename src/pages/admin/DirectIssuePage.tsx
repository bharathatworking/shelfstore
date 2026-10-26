import {
  BookOpen,
  ShieldAlert,
  User as UserIcon,
  UserPlus,
  X,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router"
import { BookIdentity } from "@/components/admin/BookIdentity"
import { CheckItem } from "@/components/admin/CheckItem"
import { MemberIdentity } from "@/components/admin/MemberIdentity"
import { PickList } from "@/components/admin/PickList"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Heading } from "@/components/ui/Heading"
import { IconButton } from "@/components/ui/IconButton"
import { Modal } from "@/components/ui/Modal"
import { SearchField } from "@/components/ui/SearchField"
import { Skeleton } from "@/components/ui/Skeleton"
import { Text } from "@/components/ui/Text"
import { Textarea } from "@/components/ui/Textarea"
import { useAdminRefresh } from "@/context/AdminRefreshContext"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { formatDate, rupees } from "@/lib/format"
import {
  directIssue,
  dueDateIfIssuedNow,
  findMembers,
  getAdminBook,
  getCopiesForBook,
  getEligibility,
  getUser,
  searchBooks,
  type Eligibility,
} from "@/services/api"
import type { Book, Copy, CopyStatus, User } from "@/types"

const copyStatus: Record<CopyStatus, { label: string; tone: BadgeTone }> = {
  available: { label: "On shelf", tone: "success" },
  borrowed: { label: "On loan", tone: "neutral" },
  on_hold: { label: "On hold", tone: "info" },
  damaged: { label: "Damaged", tone: "warning" },
  lost: { label: "Lost", tone: "danger" },
  retired: { label: "Retired", tone: "neutral" },
}

function Panel({
  step,
  title,
  icon: Icon,
  children,
}: {
  step: number
  title: string
  icon: typeof UserIcon
  children: ReactNode
}) {
  return (
    <Card as="section">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary-tint text-caption font-semibold text-primary">
            {step}
          </span>
          <Heading level={3}>{title}</Heading>
          <Icon
            aria-hidden
            strokeWidth={1.5}
            className="ml-auto size-4 text-ink-subtle"
          />
        </div>
        {children}
      </div>
    </Card>
  )
}

function useDebounced(value: string, ms = 150) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function StudentPanel({
  member,
  eligibility,
  onPick,
  onClear,
}: {
  member: User | null
  eligibility: Eligibility | null | undefined
  onPick: (u: User) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState("")
  const q = useDebounced(query)
  const results = useAsync(
    () => (member ? Promise.resolve(null) : findMembers(q)),
    [q, member],
  )
  const e = eligibility

  return (
    <Panel step={1} title="Student" icon={UserIcon}>
      {member ? (
        <>
          <div className="flex items-center justify-between gap-3 rounded-md border border-line p-4">
            <MemberIdentity user={member} size="lg" />
            <IconButton icon={X} label="Change student" onClick={onClear} />
          </div>
          <ul aria-label="Eligibility" className="flex flex-col gap-3">
            {!e ? (
              Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-9" />
              ))
            ) : (
              <>
                <CheckItem
                  ok={e.checks.books}
                  label="Under the borrowing limit"
                  detail={`${e.booksOut} of ${e.limit} books out or on hold`}
                />
                <CheckItem
                  ok={e.checks.fines}
                  label="Fines below the limit"
                  detail={
                    e.fines
                      ? `${rupees(e.fines)} outstanding, limit ${rupees(e.threshold)}`
                      : "No outstanding fines"
                  }
                />
                <CheckItem
                  ok={e.checks.account}
                  label="Account in good standing"
                  detail={
                    e.status === "active" ? "Active" : "Account suspended"
                  }
                />
              </>
            )}
          </ul>
        </>
      ) : (
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            onSubmit={() => results.data?.[0] && onPick(results.data[0])}
            placeholder="Name or USN"
            label="Find a student"
          />
          {results.error ? (
            <AsyncError error={results.error} onRetry={results.reload} />
          ) : results.loading ? (
            <Skeleton className="h-24" />
          ) : results.data && results.data.length > 0 ? (
            <PickList
              label="Students"
              items={results.data}
              itemKey={(u) => u._id}
              onPick={onPick}
              render={(u) => <MemberIdentity user={u} />}
            />
          ) : results.data ? (
            <Text tone="muted" variant="small">
              No students match “{q}”.
            </Text>
          ) : null}
        </>
      )}
    </Panel>
  )
}

interface BookPanelProps {
  book: Book | null
  copies: Copy[] | null | undefined
  copyId: string | null
  onPickBook: (b: Book) => void
  onPickCopy: (c: Copy) => void
  onClear: () => void
}

function BookPanel({
  book,
  copies,
  copyId,
  onPickBook,
  onPickCopy,
  onClear,
}: BookPanelProps) {
  const [query, setQuery] = useState("")
  const q = useDebounced(query)
  const results = useAsync(
    () =>
      book || q.trim().length < 2 ? Promise.resolve(null) : searchBooks({ q }),
    [q, book],
  )

  return (
    <Panel step={2} title="Book" icon={BookOpen}>
      {book ? (
        <>
          <div className="flex items-center justify-between gap-3 rounded-md border border-line p-4">
            <BookIdentity
              book={book}
              code={book.shelfLocation}
              extra={book.authors[0]}
              size="md"
            />
            <IconButton icon={X} label="Change book" onClick={onClear} />
          </div>
          <div className="flex flex-col gap-2">
            <Text variant="small" weight="medium">
              Choose a copy
            </Text>
            {copies ? (
              <PickList
                label="Copies"
                items={copies}
                itemKey={(c) => c._id}
                selectedKey={copyId}
                disabled={(c) => c.status !== "available"}
                onPick={onPickCopy}
                render={(c) => (
                  <>
                    <span className="flex-1 font-mono text-body text-ink">
                      {c.barcode}
                    </span>
                    <span className="text-small capitalize text-ink-muted">
                      {c.condition}
                    </span>
                    <Badge tone={copyStatus[c.status].tone}>
                      {copyStatus[c.status].label}
                    </Badge>
                  </>
                )}
              />
            ) : (
              <Skeleton className="h-28" />
            )}
          </div>
        </>
      ) : (
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            onSubmit={() => results.data?.[0] && onPickBook(results.data[0])}
            placeholder="Title, author or ISBN"
            label="Find a book"
          />
          {results.error ? (
            <AsyncError error={results.error} onRetry={results.reload} />
          ) : results.loading && q.trim().length >= 2 ? (
            <Skeleton className="h-24" />
          ) : results.data && results.data.length > 0 ? (
            <PickList
              label="Books"
              items={results.data.slice(0, 6)}
              itemKey={(b) => b._id}
              onPick={onPickBook}
              render={(b) => (
                <BookIdentity
                  book={b}
                  extra={`${b.availableCopies} of ${b.totalCopies} on shelf`}
                />
              )}
            />
          ) : results.data ? (
            <Text tone="muted" variant="small">
              No titles match “{q}”.
            </Text>
          ) : (
            <Text tone="subtle" variant="small">
              Type at least two characters.
            </Text>
          )}
        </>
      )}
    </Panel>
  )
}

export function DirectIssuePage() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const { version, bump } = useAdminRefresh()
  const memberId = params.get("member")
  const bookId = params.get("book")
  const copyId = params.get("copy")
  const member = useAsync(
    () => (memberId ? getUser(memberId) : Promise.resolve(null)),
    [memberId],
  )
  const book = useAsync(
    () => (bookId ? getAdminBook(bookId) : Promise.resolve(null)),
    [bookId, version],
  )
  const eligibility = useAsync(
    () => (memberId ? getEligibility(memberId) : Promise.resolve(null)),
    [memberId, version],
  )
  const copies = useAsync(
    () => (bookId ? getCopiesForBook(bookId) : Promise.resolve(null)),
    [bookId, version],
  )
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const update = (patch: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        return next
      },
      { replace: true },
    )
  }

  // Preselect the first copy on the shelf once a book is chosen.
  const firstFree = copies.data?.find((c) => c.status === "available")?._id
  useEffect(() => {
    if (!copyId && firstFree) update({ copy: firstFree })
  }, [copyId, firstFree])

  const m = memberId ? (member.data ?? null) : null
  const b = bookId ? (book.data ?? null) : null
  const copyList = bookId ? copies.data : null
  const copy =
    copyList?.find((c) => c._id === copyId && c.status === "available") ?? null
  const e = memberId ? eligibility.data : null
  const ready = Boolean(m && b && copy && e)
  const blocked = Boolean(e && !e.eligible)

  const issue = async (reason?: string) => {
    if (!m || !copy || !b) return
    setBusy(true)
    try {
      const loan = await directIssue(m._id, copy._id, reason)
      toast(
        "success",
        "Book issued",
        `${b.title} (${copy.barcode}) to ${m.name}, due ${formatDate(loan.dueDate)}.`,
      )
      setOverrideOpen(false)
      bump()
      setParams({}, { replace: true })
    } catch (err) {
      toast("danger", "Could not issue", (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const confirmOverride = () => {
    if (!overrideReason.trim())
      return setOverrideError("A reason is required to override.")
    issue(overrideReason)
  }

  return (
    <div className="flex flex-col gap-6 pb-40 sm:pb-24">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <StudentPanel
          member={m}
          eligibility={e}
          onPick={(u) => update({ member: u._id })}
          onClear={() => update({ member: null })}
        />
        <BookPanel
          book={b}
          copies={copyList}
          copyId={copyId}
          onPickBook={(x) => update({ book: x._id, copy: null })}
          onPickCopy={(c) => update({ copy: c._id })}
          onClear={() => update({ book: null, copy: null })}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-surface px-4 py-3 md:px-6 lg:left-(--container-sidebar) lg:px-8 lg:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-body sm:gap-3">
            {ready ? (
              <>
                <span className="font-medium text-ink">{m!.name}</span>
                <span className="text-ink-subtle">·</span>
                <span className="truncate font-serif font-semibold text-ink">
                  {b!.title}
                </span>
                <span className="font-mono text-small text-ink-muted">
                  {copy!.barcode}
                </span>
                <span className="text-ink-subtle">·</span>
                <span className="tabular-nums text-ink-muted">
                  Due {formatDate(dueDateIfIssuedNow())}
                </span>
                {blocked && <Badge tone="danger">Not eligible</Badge>}
              </>
            ) : (
              <span className="text-ink-muted">
                {!m
                  ? "Choose a student"
                  : !b
                    ? "Choose a book"
                    : "Choose a copy on the shelf"}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {ready && blocked && (
              <Button
                variant="secondary"
                icon={ShieldAlert}
                onClick={() => {
                  setOverrideReason("")
                  setOverrideError(null)
                  setOverrideOpen(true)
                }}
              >
                Override
              </Button>
            )}
            <Button
              icon={UserPlus}
              disabled={!ready || blocked}
              loading={busy && !overrideOpen}
              onClick={() => issue()}
              className="flex-1 sm:flex-none"
            >
              Issue book
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        title="Issue with override"
        fullScreenOnMobile
        footer={
          <>
            <Button variant="secondary" onClick={() => setOverrideOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmOverride} loading={busy}>
              Issue anyway
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Text tone="muted">
            {m?.name} doesn't meet every borrowing rule. The reason is saved to
            the activity log.
          </Text>
          <Textarea
            label="Reason for override"
            value={overrideReason}
            autoFocus
            error={overrideError}
            onChange={(ev) => {
              setOverrideReason(ev.target.value)
              setOverrideError(null)
            }}
            placeholder="e.g. Final-year project, approved by the HoD"
          />
        </div>
      </Modal>
    </div>
  )
}
