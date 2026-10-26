import type { LucideIcon } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from './cx'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string | null
  hint?: ReactNode
  icon?: LucideIcon
  mono?: boolean
}

export function TextField({ label, error, hint, icon: Icon, mono, id, className, ...rest }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-small font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon aria-hidden strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            'h-10 w-full rounded-sm border bg-surface px-3 text-body text-ink placeholder:text-ink-subtle transition-colors focus:outline-none focus:ring-2',
            error ? 'border-danger focus:ring-danger-bg' : 'border-line-input focus:border-primary focus:ring-primary-tint',
            Icon && 'pl-9',
            mono && 'font-mono',
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-small text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-small text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
