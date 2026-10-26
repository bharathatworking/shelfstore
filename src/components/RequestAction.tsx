import { CircleAlert } from 'lucide-react'
import type { BookAction } from '@/services/api'
import { formatDate, formatDay } from '@/lib/format'
import { Button } from './ui/Button'

interface RequestActionProps {
  action: BookAction
  loading: boolean
  onRequest: () => void
}

export function RequestAction({ action, loading, onRequest }: RequestActionProps) {
  switch (action.kind) {
    case 'available':
      return (
        <Button onClick={onRequest} loading={loading} className="w-full sm:w-auto sm:min-w-44">
          Request book
        </Button>
      )
    case 'waitlist':
      return (
        <Button onClick={onRequest} loading={loading} className="w-full sm:w-auto sm:min-w-44">
          Join waitlist
        </Button>
      )
    case 'requested':
      return (
        <Button disabled className="w-full sm:w-auto">
          {action.holdExpiresAt ? `Requested · collect by ${formatDay(action.holdExpiresAt)}` : 'Requested · awaiting review'}
        </Button>
      )
    case 'borrowed':
      return (
        <Button disabled className="w-full sm:w-auto">
          You have this until {formatDate(action.dueDate)}
        </Button>
      )
    case 'blocked':
      return (
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <Button disabled className="w-full sm:w-auto sm:min-w-44">
            Request book
          </Button>
          <p className="flex max-w-md items-start gap-1.5 text-small text-danger">
            <CircleAlert aria-hidden strokeWidth={1.5} className="mt-0.5 size-4 shrink-0" />
            {action.reason}
          </p>
        </div>
      )
  }
}
