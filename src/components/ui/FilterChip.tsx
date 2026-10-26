import { cx } from './cx'

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
  count?: number
}

/** Toggleable filter chip. For removable applied-filter chips, use Chip. */
export function FilterChip({ label, active, onClick, count }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 items-center gap-1.5 rounded-sm border px-3 text-small font-medium tabular-nums transition-colors',
        active
          ? 'border-primary bg-primary-tint text-primary'
          : 'border-line-input bg-surface text-ink-muted hover:bg-hover hover:text-ink',
      )}
    >
      {label}
      {count !== undefined && (
        <span className={active ? 'text-primary' : 'text-ink-subtle'}>
          {count}
        </span>
      )}
    </button>
  )
}
