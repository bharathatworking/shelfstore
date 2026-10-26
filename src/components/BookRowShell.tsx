import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Book } from '@/types'
import { BookCover } from './ui/BookCover'

interface BookRowShellProps {
  book: Book
  badge: ReactNode
  meta: ReactNode
  action?: ReactNode
}

/** Shared layout for My books rows: thumbnail, title, meta, badge and action. */
export function BookRowShell({ book, badge, meta, action }: BookRowShellProps) {
  return (
    <li className="flex gap-4 px-4 py-4 md:px-5">
      <Link to={`/books/${book._id}`} className="w-12 shrink-0 md:w-14" tabIndex={-1} aria-hidden>
        <BookCover title={book.title} author={book.authors[0]} color={book.coverColor} size="xs" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <Link to={`/books/${book._id}`} className="truncate font-serif text-body font-semibold text-ink hover:underline hover:underline-offset-4">
            {book.title}
          </Link>
          <div className="text-small text-ink-muted">{meta}</div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
          {badge}
          {action}
        </div>
      </div>
    </li>
  )
}
