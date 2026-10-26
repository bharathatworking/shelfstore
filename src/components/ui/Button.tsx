import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from './cx'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  icon?: LucideIcon
  to?: string
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover disabled:bg-sunken disabled:text-ink-subtle',
  secondary:
    'border border-line-input bg-surface text-ink hover:bg-hover disabled:bg-sunken disabled:text-ink-subtle disabled:border-line',
  ghost: 'text-ink-muted hover:bg-hover hover:text-ink disabled:text-ink-subtle',
}

const sizes: Record<Size, string> = {
  md: 'h-10 px-4 text-body',
  sm: 'h-8 px-3 text-small',
}

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', fullWidth = false) {
  return cx(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon: Icon,
  to,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = cx(buttonClasses(variant, size, fullWidth), className)
  const content = (
    <>
      {loading ? <Spinner /> : Icon ? <Icon aria-hidden strokeWidth={1.5} className="size-4" /> : null}
      <span className="truncate">{children}</span>
    </>
  )
  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {content}
    </button>
  )
}
