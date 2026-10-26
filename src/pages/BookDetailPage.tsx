import { ArrowLeft, Bookmark, BookmarkCheck, BookX } from "lucide-react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { BookDetailSkeleton } from "@/components/BookDetailSkeleton"
import { CopiesCard } from "@/components/CopiesCard"
import { MetadataTable } from "@/components/MetadataTable"
import { RequestAction } from "@/components/RequestAction"
import { RequestResultModal } from "@/components/RequestResultModal"
import { Badge } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { BookCover } from "@/components/ui/BookCover"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { useCurrentUser } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { formatDate } from "@/lib/format"
import {
  getBookDetail,
  getSettings,
  requestBook,
  toggleSaved,
  type BookAction,
  type RequestOutcome,
} from "@/services/api"

function UserStateBadge({ action }: { action: BookAction }) {
  if (action.kind === "borrowed")
    return <Badge tone="neutral">Borrowed by you</Badge>
  if (action.kind === "requested")
    return (
      <Badge tone="info">
        {action.status === "approved" ? "On hold for you" : "Pending"}
      </Badge>
    )
  if (action.kind === "blocked") return <Badge tone="danger">Blocked</Badge>
  return null
}

export function BookDetailPage() {
  const { bookId = "" } = useParams()
  const user = useCurrentUser()
  const toast = useToast()
  const navigate = useNavigate()
  const detail = useAsync(
    () => getBookDetail(user._id, bookId),
    [user._id, bookId],
  )
  const settings = useAsync(getSettings, [])
  const [requesting, setRequesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [outcome, setOutcome] = useState<RequestOutcome | null>(null)

  if (detail.error)
    return <AsyncError error={detail.error} onRetry={detail.reload} />
  if (detail.loading && !detail.data) return <BookDetailSkeleton />
  if (!detail.data)
    return (
      <EmptyState
        icon={BookX}
        title="Book not found"
        description="It may have been removed from the catalogue."
        action={<Button to="/browse">Back to browse</Button>}
      />
    )

  const { book, copies, action, saved } = detail.data
  const loanDays = settings.data?.loanPeriodDays ?? 14

  const request = async () => {
    setRequesting(true)
    try {
      const result = await requestBook(user._id, book._id)
      setOutcome(result)
      detail.reload()
    } catch (err) {
      toast("danger", "Request not sent", (err as Error).message)
    } finally {
      setRequesting(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const nowSaved = await toggleSaved(user._id, book._id)
      toast(
        "success",
        nowSaved ? "Saved for later" : "Removed from saved",
        book.title,
      )
      detail.reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <article>
      <Button
        variant="ghost"
        size="sm"
        icon={ArrowLeft}
        onClick={() => navigate(-1)}
        className="-ml-3 mb-4"
      >
        Back
      </Button>
      <div className="grid gap-8 md:grid-cols-12 md:gap-12">
        <div className="flex flex-col gap-5 md:col-span-4">
          <div className="mx-auto w-3/5 sm:w-2/5 md:w-full">
            <BookCover
              title={book.title}
              author={book.authors[0]}
              color={book.coverColor}
              size="lg"
            />
          </div>
          <CopiesCard copies={copies} />
        </div>

        <div className="flex min-w-0 flex-col gap-6 md:col-span-8">
          <header className="flex flex-col gap-2">
            <Text variant="caption" tone="subtle">
              {book.genres.join(" · ")}
            </Text>
            <Heading level={1}>{book.title}</Heading>
            <Text tone="muted">by {book.authors.join(", ")}</Text>
            <div className="mt-1 flex flex-wrap gap-2">
              {book.availableCopies > 0 ? (
                <Badge tone="success">Available</Badge>
              ) : (
                <Badge tone="neutral">All copies borrowed</Badge>
              )}
              <UserStateBadge action={action} />
            </div>
          </header>

          <div className="flex flex-col items-start gap-3 sm:flex-row">
            <RequestAction
              action={action}
              loading={requesting}
              onRequest={request}
            />
            <Button
              variant="secondary"
              icon={saved ? BookmarkCheck : Bookmark}
              loading={saving}
              onClick={save}
              className="w-full sm:w-auto"
            >
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
          {action.kind === "borrowed" && (
            <Text variant="small" tone="muted" className="-mt-3">
              Due back on {formatDate(action.dueDate)}. You can renew it from My
              books.
            </Text>
          )}

          <MetadataTable book={book} loanDays={loanDays} />

          <section className="flex flex-col gap-2">
            <Heading level={3}>About this book</Heading>
            <Text tone="muted" className="max-w-prose">
              {book.description}
            </Text>
          </section>
        </div>
      </div>

      <RequestResultModal
        outcome={outcome}
        loanDays={loanDays}
        onClose={() => setOutcome(null)}
      />
    </article>
  )
}
