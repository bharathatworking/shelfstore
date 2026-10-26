import { Check } from 'lucide-react'
import { useId } from 'react'

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  meta?: string | number
}

export function Checkbox({ label, checked, onChange, meta }: CheckboxProps) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 rounded-sm py-1.5 text-body text-ink">
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-4 cursor-pointer appearance-none rounded-sm border border-line-input bg-surface checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <Check aria-hidden strokeWidth={2} className="pointer-events-none absolute size-3 text-on-primary opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="flex-1">{label}</span>
      {meta !== undefined && <span className="text-small text-ink-subtle">{meta}</span>}
    </label>
  )
}
