import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import { cx } from './cx'

interface SelectProps<T extends string> {
  label: string
  hideLabel?: boolean
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  className?: string
  size?: 'md' | 'sm'
}

export function Select<T extends string>({ label, hideLabel, value, onChange, options, className, size = 'md' }: SelectProps<T>) {
  const id = useId()
  return (
    <div className={cx('flex flex-col gap-1.5', hideLabel && 'gap-0', className)}>
      <label htmlFor={id} className={cx('text-small font-medium text-ink', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={cx(
            'w-full cursor-pointer appearance-none rounded-sm border border-line-input bg-surface pl-3 pr-9 text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-tint',
            size === 'sm' ? 'h-9 text-small' : 'h-10 text-body',
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
      </div>
    </div>
  )
}
