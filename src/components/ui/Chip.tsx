import { X } from 'lucide-react'

export function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-sm border border-line bg-surface pl-2.5 pr-1 text-small text-ink">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="rounded-sm p-0.5 text-ink-subtle hover:bg-hover hover:text-ink"
      >
        <X aria-hidden strokeWidth={1.5} className="size-3.5" />
      </button>
    </span>
  )
}
