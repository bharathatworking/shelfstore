import { Search, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { cx } from './cx'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  size?: 'md' | 'lg'
  placeholder?: string
  autoFocus?: boolean
  className?: string
  label?: string
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  size = 'md',
  placeholder = 'Search by title, author or ISBN',
  autoFocus,
  className,
  label = 'Search the catalogue',
}: SearchFieldProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(value.trim())
  }
  const large = size === 'lg'
  return (
    <form role="search" onSubmit={submit} className={cx('relative w-full', className)}>
      <Search
        aria-hidden
        strokeWidth={1.5}
        className={cx('pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-subtle', large ? 'left-4 size-5' : 'left-3 size-4')}
      />
      <input
        type="search"
        aria-label={label}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          'w-full rounded-sm border border-line-input bg-surface text-ink placeholder:text-ink-subtle transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-tint [&::-webkit-search-cancel-button]:hidden',
          large ? 'h-13 pl-12 pr-11 text-body' : 'h-9 pl-9 pr-9 text-small',
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className={cx('absolute top-1/2 -translate-y-1/2 rounded-sm p-1 text-ink-subtle hover:bg-hover hover:text-ink', large ? 'right-3' : 'right-2')}
        >
          <X aria-hidden strokeWidth={1.5} className="size-4" />
        </button>
      )}
    </form>
  )
}
