import { cx } from './cx'

interface Tab<T extends string> {
  id: T
  label: string
  count?: number
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[]
  value: T
  onChange: (id: T) => void
  label: string
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cx(
              '-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 text-body font-medium transition-colors',
              active ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cx(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 text-small',
                  active ? 'bg-primary-tint text-primary' : 'bg-sunken text-ink-muted',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
