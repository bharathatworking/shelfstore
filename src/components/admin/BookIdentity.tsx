import type { ReactNode } from 'react'
import type { Book } from '@/types'
import { BookCover } from '../ui/BookCover'
import { cx } from '../ui/cx'

interface BookIdentityProps {
  book: Book
  /** Mono detail line, e.g. barcode or shelf code. */
  code?: string
  extra?: ReactNode
  size?: 'sm' | 'md'
}

export function BookIdentity({
  book,
  code,
  extra,
  size = 'sm',
}: BookIdentityProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={cx('shrink-0', size === 'md' ? 'w-12' : 'w-8')}>
        <BookCover
          title={book.title}
          author={book.authors[0]}
          color={book.coverColor}
          size="xs"
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-serif text-body font-semibold text-ink">
          {book.title}
        </span>
        <span className="truncate text-small text-ink-muted">
          {code && <span className="font-mono">{code}</span>}
          {code && extra ? ' · ' : null}
          {extra}
        </span>
      </div>
    </div>
  )
}
