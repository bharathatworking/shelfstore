import type { HistoryEntry } from '@/services/api'
import { formatDate } from '@/lib/format'
import { BookRowShell } from './BookRowShell'
import { Badge, type BadgeTone } from './ui/Badge'

const badges: Record<HistoryEntry['status'], { tone: BadgeTone; label: string; verb: string }> = {
  returned: { tone: 'success', label: 'Returned', verb: 'Returned' },
  lost: { tone: 'danger', label: 'Lost', verb: 'Marked lost' },
  rejected: { tone: 'danger', label: 'Rejected', verb: 'Request rejected' },
  expired: { tone: 'neutral', label: 'Expired', verb: 'Hold expired' },
  cancelled: { tone: 'neutral', label: 'Cancelled', verb: 'Request cancelled' },
}

export function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const b = badges[entry.status]
  return (
    <BookRowShell
      book={entry.book}
      badge={<Badge tone={b.tone}>{b.label}</Badge>}
      meta={
        <>
          {b.verb} {formatDate(entry.date)}
          {entry.note && <span className="block text-ink-subtle">{entry.note}</span>}
        </>
      }
    />
  )
}
