import { useId } from "react"
import { cx } from "./cx"

interface OptionGroupProps<T extends string> {
  label: string
  value: T | null
  onChange: (value: T) => void
  options: Array<{ value: T label: string description?: string }>
  layout?: "row" | "stack"
}

/** Single-choice radio group rendered as bordered options. */
export function OptionGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  layout = "row",
}: OptionGroupProps<T>) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-2 text-small font-medium text-ink">{label}</legend>
      <div
        className={cx(
          "gap-2",
          layout === "row" ? "flex flex-wrap" : "flex flex-col",
        )}
      >
        {options.map((o) => {
          const checked = value === o.value
          return (
            <label
              key={o.value}
              className={cx(
                "flex cursor-pointer items-start gap-2.5 rounded-sm border px-3 py-2 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                checked
                  ? "border-primary bg-primary-tint"
                  : "border-line-input bg-surface hover:bg-hover",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="mt-1 size-3.5 shrink-0 cursor-pointer appearance-none rounded-lg border border-line-input bg-surface checked:border-4 checked:border-primary focus:outline-none"
              />
              <span className="flex flex-col">
                <span
                  className={cx(
                    "text-body",
                    checked ? "text-primary" : "text-ink",
                  )}
                >
                  {o.label}
                </span>
                {o.description && (
                  <span className="text-small text-ink-subtle">
                    {o.description}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
