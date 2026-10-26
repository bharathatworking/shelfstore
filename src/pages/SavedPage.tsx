import { Bookmark } from "lucide-react"
import { useState } from "react"
import { BookCard } from "@/components/BookCard"
import { BookCardSkeleton } from "@/components/BookCardSkeleton"
import { Button } from "@/components/ui/Button"
import { AsyncError } from "@/components/ui/AsyncError"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { useCurrentUser } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { getSavedBooks, requestBook } from "@/services/api"

export function SavedPage() {
  const user = useCurrentUser()
  const toast = useToast()
  const saved = useAsync(() => getSavedBooks(user._id), [user._id])
  const [busyId, setBusyId] = useState<string | null>(null)

  const request = async (bookId: string, title: string) => {
    setBusyId(bookId)
    try {
      const outcome = await requestBook(user._id, bookId)
      toast(
        "success",
        outcome.request.status === "approved"
          ? "Book reserved"
          : "Request sent",
        title,
      )
      saved.reload()
    } catch (error) {
      toast("danger", "Could not request", (error as Error).message)
    } finally {
      setBusyId(null)
    }
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading level={1}>Saved</Heading>
        <Text variant="small" tone="muted" className="mt-1">
          Books you want to read later. Saving does not reserve a copy.
        </Text>
      </div>
      {saved.error ? (
        <Card padding="none">
          <AsyncError error={saved.error} onRetry={saved.reload} />
        </Card>
      ) : saved.loading && !saved.data ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i}>
              <BookCardSkeleton />
            </li>
          ))}
        </ul>
      ) : saved.data?.length ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {saved.data.map((b) => (
            <li key={b._id}>
              <div className="flex h-full flex-col gap-3">
                <BookCard book={b} />
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  loading={busyId === b._id}
                  onClick={() => request(b._id, b.title)}
                >
                  {b.availableCopies > 0 ? "Quick request" : "Join waitlist"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Card padding="none">
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Use Save on any book page to keep it here for later."
            action={<Button to="/browse">Browse books</Button>}
          />
        </Card>
      )}
    </div>
  )
}
