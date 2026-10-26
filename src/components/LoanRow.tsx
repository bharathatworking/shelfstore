import { RotateCw } from "lucide-react"
import type { LoanView } from "@/services/api"
import { dueLabel, formatDate, rupees } from "@/lib/format"
import { BookRowShell } from "./BookRowShell"
import { Badge } from "./ui/Badge"
import { Button } from "./ui/Button"

interface LoanRowProps {
  loan: LoanView
  maxRenewals: number
  renewing: boolean
  onRenew: () => void
}

export function LoanRow({
  loan,
  maxRenewals,
  renewing,
  onRenew,
}: LoanRowProps) {
  const badge =
    loan.daysOverdue > 0 ? (
      <Badge tone="danger">Overdue · {rupees(loan.fine)}</Badge>
    ) : loan.dueSoon ? (
      <Badge tone="warning">Due soon</Badge>
    ) : (
      <Badge tone="neutral">Borrowed</Badge>
    )
  return (
    <BookRowShell
      book={loan.book}
      badge={badge}
      meta={
        <>
          <span className={loan.daysOverdue > 0 ? "text-danger" : undefined}>
            Due {formatDate(loan.dueDate)} · {dueLabel(loan.dueDate)}
          </span>
          <span className="block text-ink-subtle">
            {loan.renewBlockedReason ??
              `Renewed ${loan.renewCount} of ${maxRenewals} times`}
          </span>
        </>
      }
      action={
        <>
          <Button variant="ghost" size="sm" to={`/loans/${loan._id}`}>
            Details
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCw}
            loading={renewing}
            disabled={Boolean(loan.renewBlockedReason)}
            onClick={onRenew}
          >
            Renew
          </Button>
        </>
      }
    />
  )
}
