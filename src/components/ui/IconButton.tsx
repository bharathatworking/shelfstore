import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from './cx'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  to?: string
  badge?: ReactNode
}

const classes =
  'relative inline-flex size-10 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-hover hover:text-ink'

export function IconButton({ icon: Icon, label, to, badge, className, type = 'button', ...rest }: IconButtonProps) {
  const inner = (
    <>
      <Icon aria-hidden strokeWidth={1.5} className="size-5" />
      {badge}
    </>
  )
  if (to) {
    return (
      <Link to={to} aria-label={label} title={label} className={cx(classes, className)}>
        {inner}
      </Link>
    )
  }
  return (
    <button type={type} aria-label={label} title={label} className={cx(classes, className)} {...rest}>
      {inner}
    </button>
  )
}
