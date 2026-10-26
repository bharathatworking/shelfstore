import type { ReactNode } from 'react'
import { cx } from './cx'

const styles = {
  1: 'font-serif text-h1 font-semibold text-ink',
  2: 'font-serif text-h2 font-semibold text-ink',
  3: 'font-sans text-h3 font-semibold text-ink',
} as const

interface HeadingProps {
  level: 1 | 2 | 3
  /** Render a different element than the visual level, e.g. a book title styled as h2 inside an h3 slot. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p'
  className?: string
  id?: string
  children: ReactNode
}

export function Heading({ level, as, className, id, children }: HeadingProps) {
  const Tag = as ?? (`h${level}` as const)
  return (
    <Tag id={id} className={cx(styles[level], className)}>
      {children}
    </Tag>
  )
}
