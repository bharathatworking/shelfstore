import type { ReactNode } from "react"
import { cx } from "../ui/cx"

interface PickListProps<T> {
  label: string
  items: T[]
  itemKey: (item: T) => string
  render: (item: T) => ReactNode
  onPick: (item: T) => void
  disabled?: (item: T) => boolean
  selectedKey?: string | null
}

/** Selectable result list for the search panels. */
export function PickList<T>({
  label,
  items,
  itemKey,
  render,
  onPick,
  disabled,
  selectedKey,
}: PickListProps<T>) {
  return (
    <ul
      aria-label={label}
      className="flex flex-col divide-y divide-line overflow-hidden rounded-md border border-line"
    >
      {items.map((item) => {
        const key = itemKey(item)
        const isDisabled = disabled?.(item) ?? false
        return (
          <li key={key}>
            <button
              type="button"
              disabled={isDisabled}
              aria-pressed={selectedKey === key}
              onClick={() => onPick(item)}
              className={cx(
                "flex w-full flex-wrap items-center gap-3 px-4 py-2.5 text-left transition-colors sm:flex-nowrap",
                selectedKey === key ? "bg-primary-tint" : "hover:bg-hover",
                isDisabled &&
                  "cursor-not-allowed opacity-60 hover:bg-transparent",
              )}
            >
              {render(item)}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
