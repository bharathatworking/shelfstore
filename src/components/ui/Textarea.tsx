import { useId, type TextareaHTMLAttributes } from 'react'
import { cx } from './cx'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string | null
}

export function Textarea({
  label,
  error,
  id,
  className,
  ...rest
}: TextareaProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-small font-medium text-ink">
        {label}
      </label>
      <textarea
        id={inputId}
        rows={3}
        aria-invalid={error ? true : undefined}
        className={cx(
          'w-full resize-none rounded-sm border bg-surface px-3 py-2 text-body text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2',
          error
            ? 'border-danger focus:ring-danger-bg'
            : 'border-line-input focus:border-primary focus:ring-primary-tint',
        )}
        {...rest}
      />
      {error && <p className="text-small text-danger">{error}</p>}
    </div>
  )
}
