import type { ReactNode } from 'react'
import { cx } from './cx'

const variants = {
  body: 'text-body',
  small: 'text-small',
  caption: 'text-caption uppercase tracking-wider font-medium',
} as const

const tones = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  subtle: 'text-ink-subtle',
  danger: 'text-danger',
  success: 'text-success',
  warning: 'text-warning',
  primary: 'text-primary',
  accent: 'text-accent',
} as const

interface TextProps {
  variant?: keyof typeof variants
  tone?: keyof typeof tones
  as?: 'p' | 'span' | 'div' | 'dt' | 'dd' | 'label'
  mono?: boolean
  serif?: boolean
  weight?: 'normal' | 'medium' | 'semibold'
  className?: string
  id?: string
  children: ReactNode
}

const weights = { normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold' }

export function Text({ variant = 'body', tone = 'default', as: Tag = 'p', mono, serif, weight, className, id, children }: TextProps) {
  return (
    <Tag
      id={id}
      className={cx(variants[variant], tones[tone], mono && 'font-mono', serif && 'font-serif font-semibold', weight && weights[weight], className)}
    >
      {children}
    </Tag>
  )
}
