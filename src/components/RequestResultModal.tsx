import { CircleCheck, Clock } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { RequestOutcome } from '@/services/api'
import { formatDayTime } from '@/lib/format'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Text } from './ui/Text'

interface RequestResultModalProps {
  outcome: RequestOutcome | null
  loanDays: number
  onClose: () => void
}

export function RequestResultModal({ outcome, loanDays, onClose }: RequestResultModalProps) {
  const navigate = useNavigate()
  const approved = outcome?.request.status === 'approved'
  return (
    <Modal
      open={Boolean(outcome)}
      onClose={onClose}
      title={approved ? 'Book reserved for you' : 'Sent to the librarian for review'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => navigate('/my-books?tab=requests')}>View my books</Button>
        </>
      }
    >
      {outcome && (
        <div className="flex flex-col gap-4">
          <Text serif>{outcome.book.title}</Text>
          {approved ? (
            <div className="flex gap-3 rounded-md border border-success-line bg-success-bg p-4">
              <CircleCheck aria-hidden strokeWidth={1.5} className="mt-0.5 size-5 shrink-0 text-success" />
              <div className="flex flex-col gap-1">
                <Text weight="medium">
                  Collect from shelf <span className="font-mono">{outcome.book.shelfLocation}</span> by{' '}
                  {formatDayTime(outcome.request.holdExpiresAt!)}
                </Text>
                <Text variant="small" tone="muted">
                  The {loanDays}-day loan starts when you collect it
                </Text>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 rounded-md border border-info-line bg-info-bg p-4">
              <Clock aria-hidden strokeWidth={1.5} className="mt-0.5 size-5 shrink-0 text-info" />
              <div className="flex flex-col gap-1">
                <Text weight="medium">{outcome.request.flagReason}</Text>
                <Text variant="small" tone="muted">
                  We will let you know as soon as the librarian decides.
                </Text>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
