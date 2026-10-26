import { X } from 'lucide-react'
import { cx } from './cx'

export type ToastTone = 'success' | 'warning' | 'danger' | 'info'

export interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

const borders: Record<ToastTone, string> = {
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
  info: 'border-l-info',
}

export function Toaster({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-60 flex flex-col items-end gap-2 md:inset-x-auto md:bottom-6 md:right-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cx(
            'pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-md border border-l-4 border-line bg-surface py-3 pl-4 pr-2 shadow-pop',
            borders[t.tone],
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-body font-medium text-ink">{t.title}</p>
            {t.description && <p className="mt-0.5 text-small text-ink-muted">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            className="rounded-sm p-1 text-ink-subtle hover:bg-hover hover:text-ink"
          >
            <X aria-hidden strokeWidth={1.5} className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
