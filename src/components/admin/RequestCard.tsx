import { Check, X } from "lucide-react"
import type { AdminRequestView } from "@/services/api"
import { formatDayTime, timeAgo } from "@/lib/format"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { cx } from "../ui/cx"
import { Text } from "../ui/Text"
import { BookIdentity } from "./BookIdentity"
import { MemberIdentity } from "./MemberIdentity"

interface RequestCardProps {
  view: AdminRequestView
  busy: boolean
  onApprove?: () => void
  onReject?: () => void
  /** Compact rows for the dashboard list. */
  compact?: boolean
}

export function RequestCard({
  view,
  busy,
  onApprove,
  onReject,
  compact,
}: RequestCardProps) {
  const { request, user, book, copy, flagReason } = view
  const pending = request.status === "pending"
  const noCopy = pending && book.availableCopies === 0
  const rejectReason = request.rejectReason
    ?.replace(/\byour\b/gi, `${user.name.split(" ")[0]}'s`)
    .replace(/\byou\b/gi, user.name.split(" ")[0])
  const timestamp = timeAgo(
    pending ? request.requestedAt : (request.decidedAt ?? request.requestedAt),
  )

  return (
    <div
      className={cx(
        "flex min-w-0 flex-col gap-4",
        compact
          ? "px-5 py-4"
          : "rounded-md border border-line bg-surface px-5 py-4",
      )}
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <MemberIdentity user={user} />
        <BookIdentity
          book={book}
          code={copy?.barcode ?? book.shelfLocation}
          extra={
            pending
              ? `${book.availableCopies} of ${book.totalCopies} free`
              : undefined
          }
        />
      </div>

      {pending && flagReason && (
        <div className="w-full min-w-0 max-w-full">
          <Badge
            tone="warning"
            className="h-auto min-h-5.5 w-fit min-w-0 max-w-full whitespace-normal py-1"
          >
            <span className="block min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
              {flagReason}
            </span>
          </Badge>
        </div>
      )}
      {request.status === "approved" && request.holdExpiresAt && (
        <div>
          <Badge tone="info">
            Hold until {formatDayTime(request.holdExpiresAt)}
          </Badge>
        </div>
      )}
      {request.status === "rejected" && (
        <div>
          <Badge tone="danger">{rejectReason ?? "Rejected"}</Badge>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Text
          variant="small"
          tone="subtle"
          className="tabular-nums sm:text-right"
        >
          {timestamp}
        </Text>
        {pending && (onApprove || onReject) && (
          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="secondary"
              size="sm"
              icon={X}
              onClick={onReject}
              disabled={busy}
            >
              Reject
            </Button>
            <Button
              size="sm"
              icon={Check}
              onClick={onApprove}
              loading={busy}
              disabled={noCopy}
            >
              Approve
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
