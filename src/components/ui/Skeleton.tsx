import { cx } from './cx'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('animate-soft-pulse rounded-sm bg-sunken', className)} />
}
