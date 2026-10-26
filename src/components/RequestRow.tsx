import type { RequestView } from '@/services/api'
import { formatDate, formatDayTime } from '@/lib/format'
import { BookRowShell } from './BookRowShell'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

const TWELVE_HOURS = 12 * 60 * 60 * 1000

interface RequestRowProps {
  request: RequestView
  cancelling: boolean
  onCancel: () => void
}

export function RequestRow({ request, cancelling, onCancel }: RequestRowProps) {
  const approved = request.status === 'approved' && request.holdExpiresAt
  const expiring = approved && new Date(request.holdExpiresAt!).getTime() - Date.now() < TWELVE_HOURS
  const badge = approved ? (
    <Badge tone={expiring ? 'warning' : 'info'}>{expiring ? 'Hold expiring' : 'On hold'}</Badge>
  ) : (
    <Badge tone="info">Pending</Badge>
  )
  return (
    <BookRowShell
      book={request.book}
      badge={badge}
      meta={
        approved ? (
          <>
            Collect from shelf <span className="font-mono text-ink">{request.book.shelfLocation}</span> by {formatDayTime(request.holdExpiresAt!)}
          </>
        ) : (
          <>
            <span>Requested {formatDate(request.requestedAt)}</span>
            {request.flagReason && <span className="block text-ink-subtle">{request.flagReason}</span>}
          </>
        )
      }
      action={
        <Button variant="ghost" size="sm" loading={cancelling} onClick={onCancel}>
          Cancel request
        </Button>
      }
    />
  )
}
