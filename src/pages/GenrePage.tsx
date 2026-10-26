import { Library } from "lucide-react"
import { useParams } from "react-router"
import { BookCard } from "@/components/BookCard"
import { AsyncError } from "@/components/ui/AsyncError"
import { BookCardSkeleton } from "@/components/BookCardSkeleton"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { useAsync } from "@/hooks/useAsync"
import { searchBooks } from "@/services/api"

export function GenrePage() {
  const { genre = "" } = useParams()
  const name = decodeURIComponent(genre)
  const books = useAsync(() => searchBooks({ genres: [name] }), [name])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Text variant="caption" tone="accent">
          Browse by subject
        </Text>
        <Heading level={1} className="mt-1">
          {name}
        </Heading>
        <Text tone="muted" className="mt-1">
          {books.data?.length ?? 0} titles in this collection
        </Text>
      </div>
      {books.error ? (
        <Card padding="none">
          <AsyncError error={books.error} onRetry={books.reload} />
        </Card>
      ) : books.loading && !books.data ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index}>
              <BookCardSkeleton />
            </li>
          ))}
        </ul>
      ) : books.data?.length ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {books.data.map((book) => (
            <li key={book._id}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      ) : (
        <Card padding="none">
          <EmptyState
            icon={Library}
            title="No books in this genre"
            description="Try another subject from the browse page."
          />
        </Card>
      )}
    </div>
  )
}
