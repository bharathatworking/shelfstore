import { Link } from 'react-router'
import { cx } from './ui/cx'

export function Wordmark({ to = '/browse', large = false }: { to?: string; large?: boolean }) {
  return (
    <Link to={to} className={cx('font-serif font-semibold tracking-tight text-primary', large ? 'text-h1' : 'text-h2')}>
      ShelfStore
    </Link>
  )
}
