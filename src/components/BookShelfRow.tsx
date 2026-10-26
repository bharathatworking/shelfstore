import { BookOpen } from "lucide-react"
import type { Book } from "@/types"
import { BookCard } from "./BookCard"
import { BookCardSkeleton } from "./BookCardSkeleton"
import { Heading } from "./ui/Heading"
import { AsyncError } from "./ui/AsyncError"
import { EmptyState } from "./ui/EmptyState"
import { TextLink } from "./ui/TextLink"

interface BookShelfRowProps {
  title: string
  books: Book[] | undefined
  seeAllTo?: string
  error?: Error | null
  onRetry?: () => void
}

/** Horizontally scrolling row of book cards. */
export function BookShelfRow({
  title,
  books,
  seeAllTo,
  error,
  onRetry,
}: BookShelfRowProps) {
  return (
    <section
      aria-label={title}
      className="flex min-w-0 max-w-full flex-col gap-4 overflow-hidden"
    >
      <div className="flex items-baseline justify-between gap-4">
        <Heading level={2}>{title}</Heading>
        {seeAllTo && (
          <TextLink to={seeAllTo} className="text-small">
            See all
          </TextLink>
        )}
      </div>
      {error && onRetry ? (
        <AsyncError error={error} onRetry={onRetry} />
      ) : books?.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books here yet"
          description="Titles will appear here when they are added to this collection."
        />
      ) : (
        <ul className="no-scrollbar flex w-full max-w-full snap-x gap-4 overflow-x-auto pb-1 md:gap-5">
          {(books ?? Array.from({ length: 7 }, () => null)).map((book, i) => (
            <li
              key={book?._id ?? i}
              className="w-34 shrink-0 snap-start md:w-40"
            >
              {book ? <BookCard book={book} /> : <BookCardSkeleton />}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
