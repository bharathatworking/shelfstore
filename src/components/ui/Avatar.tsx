import { cx } from './cx'

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const initials = name
    .replace(/^(mrs?|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span
      aria-hidden
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-primary-tint font-semibold text-primary',
        size === 'lg' ? 'size-14 text-h3' : 'size-8 text-small',
      )}
    >
      {initials}
    </span>
  )
}
