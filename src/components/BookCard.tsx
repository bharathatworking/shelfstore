import { Link } from 'react-router'
import type { Book } from '@/types'
import { formatAuthors } from '@/lib/format'
import { AvailabilityText } from './AvailabilityText'
import { BookCover } from './ui/BookCover'

export function BookCard({ book }: { book: Book }) {
  return (
    <Link to={`/books/${book._id}`} className="group flex flex-col gap-2.5 rounded-md">
      <BookCover title={book.title} author={book.authors[0]} color={book.coverColor} className="transition-opacity group-hover:opacity-90" />
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-2 font-serif text-body font-semibold leading-snug text-ink group-hover:underline group-hover:underline-offset-4">
          {book.title}
        </span>
        <span className="line-clamp-1 text-small text-ink-muted">{formatAuthors(book.authors)}</span>
        <AvailabilityText book={book} />
      </div>
    </Link>
  )
}
