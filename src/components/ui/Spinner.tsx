import { LoaderCircle } from 'lucide-react'
import { cx } from './cx'

/** Only for use inside buttons. */
export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden strokeWidth={1.5} className={cx('size-4 animate-spin', className)} />
}
