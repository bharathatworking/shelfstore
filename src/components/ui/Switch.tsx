import { useId } from "react"
import { cx } from "./cx"

interface SwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
}

export function Switch({ label, checked, onChange, description }: SwitchProps) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="flex cursor-pointer flex-col">
        <span className="text-body text-ink">{label}</span>
        {description && (
          <span className="text-small text-ink-subtle">{description}</span>
        )}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-lg border transition-colors",
          checked ? "border-primary bg-primary" : "border-line-input bg-sunken",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "size-3.5 rounded-lg bg-surface transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  )
}
