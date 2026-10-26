import type { ReactNode } from 'react'
import { cx } from '../ui/cx'

/** Two-column label/value rows for loan and hold details. */
export function DetailList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; tone?: 'danger' | 'default' }>
}) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2.5">
      {items.map((i) => (
        <div key={i.label} className="contents">
          <dt className="text-small text-ink-muted">{i.label}</dt>
          <dd
            className={cx(
              'text-body tabular-nums',
              i.tone === 'danger' ? 'font-medium text-danger' : 'text-ink',
            )}
          >
            {i.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
