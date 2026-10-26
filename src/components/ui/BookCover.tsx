import { cx } from './cx'

interface BookCoverProps {
  title: string
  author: string
  color: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const titleSize = { xs: '', sm: 'text-small', md: 'text-body', lg: 'text-h2' }
const pad = { xs: 'p-1', sm: 'p-2.5', md: 'p-3.5', lg: 'p-6' }

/** Typographic cover: a 3:4 block in the book's muted colour. No images. */
export function BookCover({ title, author, color, size = 'md', className }: BookCoverProps) {
  return (
    <div
      aria-hidden
      // Cover colour is per-book data, so it is applied inline.
      style={{ backgroundColor: color }}
      className={cx('relative flex aspect-3/4 w-full flex-col overflow-hidden rounded-sm text-on-primary', pad[size], className)}
    >
      <span className="absolute inset-y-0 left-0 w-1.5 bg-ink/15" />
      {size === 'xs' ? (
        <span className="mx-auto mt-1 h-px w-3/5 bg-on-primary/40" />
      ) : (
        <>
          <span className="h-px w-8 bg-on-primary/40" />
          <span className={cx('mt-2 line-clamp-4 font-serif font-semibold leading-snug', titleSize[size])}>{title}</span>
          <span
            className={cx(
              'mt-auto line-clamp-2 text-on-primary/75 [font-variant-caps:all-small-caps] tracking-wide',
              size === 'lg' ? 'text-body' : 'text-small',
            )}
          >
            {author}
          </span>
        </>
      )}
    </div>
  )
}
