import { BookOpen, ScanBarcode, User } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useAsync } from '@/hooks/useAsync'
import { adminSearch } from '@/services/api'
import { SearchField } from '../ui/SearchField'

function ResultGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="py-1">
      <p className="px-3 pb-1 pt-2 text-caption font-medium uppercase tracking-wider text-ink-subtle">
        {title}
      </p>
      {children}
    </div>
  )
}

function ResultItem({
  icon: Icon,
  primary,
  secondary,
  onSelect,
}: {
  icon: typeof User
  primary: ReactNode
  secondary: ReactNode
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-hover"
    >
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className="size-4 shrink-0 text-ink-subtle"
      />
      <span className="min-w-0 flex-1 truncate text-body text-ink">
        {primary}
      </span>
      <span className="shrink-0 text-small text-ink-subtle">{secondary}</span>
    </button>
  )
}

/** Top bar search across members, titles and copy barcodes. */
export function AdminSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150)
    return () => clearTimeout(t)
  }, [query])

  const results = useAsync(() => adminSearch(debounced), [debounced])
  const r = results.data
  const empty = r && !r.members.length && !r.books.length && !r.copies.length

  const go = (to: string) => {
    setOpen(false)
    setQuery('')
    navigate(to)
  }

  return (
    <div
      ref={root}
      className="relative w-full max-w-search"
      onFocus={() => setOpen(true)}
      onBlur={(e) => !root.current?.contains(e.relatedTarget) && setOpen(false)}
    >
      <SearchField
        value={query}
        onChange={(v) => {
          setQuery(v)
          setOpen(true)
        }}
        onSubmit={() => {
          if (r?.copies[0])
            go(
              r.copies[0].state === 'hold'
                ? `/admin/collect?code=${r.copies[0].copy.barcode}`
                : `/admin/return?barcode=${r.copies[0].copy.barcode}`,
            )
          else if (r?.members[0]) go(`/admin/issue?member=${r.members[0]._id}`)
        }}
        placeholder="Search members, titles or barcodes"
        label="Search members, titles or barcodes"
      />
      {open && debounced.trim().length >= 2 && r && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-pop">
          {empty && (
            <p className="px-3 py-3 text-small text-ink-muted">
              No members, titles or barcodes match “{debounced}”.
            </p>
          )}
          {r.members.length > 0 && (
            <ResultGroup title="Members">
              {r.members.map((m) => (
                <ResultItem
                  key={m._id}
                  icon={User}
                  primary={m.name}
                  secondary={<span className="font-mono">{m.usn}</span>}
                  onSelect={() => go(`/admin/issue?member=${m._id}`)}
                />
              ))}
            </ResultGroup>
          )}
          {r.books.length > 0 && (
            <ResultGroup title="Titles">
              {r.books.map((b) => (
                <ResultItem
                  key={b._id}
                  icon={BookOpen}
                  primary={b.title}
                  secondary={`${b.availableCopies} of ${b.totalCopies} free`}
                  onSelect={() => go(`/admin/issue?book=${b._id}`)}
                />
              ))}
            </ResultGroup>
          )}
          {r.copies.length > 0 && (
            <ResultGroup title="Copies">
              {r.copies.map(({ copy, book, state }) => (
                <ResultItem
                  key={copy._id}
                  icon={ScanBarcode}
                  primary={
                    <>
                      <span className="font-mono">{copy.barcode}</span>{' '}
                      <span className="text-ink-muted">· {book.title}</span>
                    </>
                  }
                  secondary={
                    state === 'loan'
                      ? 'Return'
                      : state === 'hold'
                        ? 'Collect'
                        : 'Issue'
                  }
                  onSelect={() =>
                    go(
                      state === 'loan'
                        ? `/admin/return?barcode=${copy.barcode}`
                        : state === 'hold'
                          ? `/admin/collect?code=${copy.barcode}`
                          : `/admin/issue?book=${book._id}`,
                    )
                  }
                />
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  )
}
