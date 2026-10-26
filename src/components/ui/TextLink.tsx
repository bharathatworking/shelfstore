import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from './cx'

export function TextLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cx('font-medium text-primary underline-offset-4 hover:underline', className)}>
      {children}
    </Link>
  )
}
