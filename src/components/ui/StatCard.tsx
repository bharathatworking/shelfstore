import type { LucideIcon } from 'lucide-react'
import { Card } from './Card'
import { cx } from './cx'
import { Skeleton } from './Skeleton'

interface StatCardProps {
  label: string
  value: number | string | undefined
  icon: LucideIcon
  tone?: 'default' | 'danger' | 'warning'
  hint?: string
}

const toneClass = {
  default: 'text-ink',
  danger: 'text-danger',
  warning: 'text-warning',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  hint,
}: StatCardProps) {
  return (
    <Card padding="sm" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-caption font-medium uppercase tracking-wider text-ink-muted">
          {label}
        </span>
        <Icon
          aria-hidden
          strokeWidth={1.5}
          className="size-4 text-ink-subtle"
        />
      </div>
      {value === undefined ? (
        <Skeleton className="h-8 w-14" />
      ) : (
        <span
          className={cx('text-h1 font-semibold tabular-nums', toneClass[tone])}
        >
          {value}
        </span>
      )}
      {hint && <span className="text-small text-ink-subtle">{hint}</span>}
    </Card>
  )
}
