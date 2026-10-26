import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface MenuProps {
  trigger: ReactNode
  label: string
  header?: ReactNode
  items: Array<{ label: string; icon?: LucideIcon; onSelect: () => void }>
}

export function Menu({ trigger, label, header, items }: MenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) =>
      !root.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex rounded-md"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-md border border-line bg-surface py-1 shadow-pop"
        >
          {header && (
            <div className="border-b border-line px-3 py-2.5">{header}</div>
          )}
          {items.map(({ label: itemLabel, icon: Icon, onSelect }) => (
            <button
              key={itemLabel}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onSelect()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-body text-ink hover:bg-hover"
            >
              {Icon && (
                <Icon
                  aria-hidden
                  strokeWidth={1.5}
                  className="size-4 text-ink-muted"
                />
              )}
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
