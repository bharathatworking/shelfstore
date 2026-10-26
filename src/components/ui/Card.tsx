import type { ReactNode } from 'react'
import { cx } from './cx'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md'
  as?: 'div' | 'section' | 'article' | 'li'
}

const paddings = { none: '', sm: 'p-4', md: 'p-5 md:p-6' }

export function Card({ children, className, padding = 'md', as: Tag = 'div' }: CardProps) {
  return <Tag className={cx('rounded-md border border-line bg-surface', paddings[padding], className)}>{children}</Tag>
}
