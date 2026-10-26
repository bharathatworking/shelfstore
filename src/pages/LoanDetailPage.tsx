import { ArrowLeft, Check, Clock, RotateCw } from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router"
import { Badge } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { BookCover } from "@/components/ui/BookCover"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { TextLink } from "@/components/ui/TextLink"
import { useCurrentUser } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { dueLabel, formatDate } from "@/lib/format"
import { getLoanDetail, getSettings, renewLoan } from "@/services/api"

export function LoanDetailPage() {
  const { loanId = "" } = useParams()
  const user = useCurrentUser()
  const toast = useToast()
  const detail = useAsync(
    () => getLoanDetail(user._id, loanId),
    [user._id, loanId],
  )
  const settings = useAsync(getSettings, [])
  const [renewing, setRenewing] = useState(false)
  const data = detail.data

  const renew = async () => {
    setRenewing(true)
    try {
      const loan = await renewLoan(user._id, loanId)
      toast(
        "success",
        "Loan renewed",
        `${loan.book.title} is now due ${formatDate(loan.dueDate)}.`,
      )
      detail.reload()
    } catch (error) {
      toast("danger", "Could not renew", (error as Error).message)
    } finally {
      setRenewing(false)
    }
  }

  if (detail.error)
    return (
      <Card padding="none">
        <AsyncError error={detail.error} onRetry={detail.reload} />
      </Card>
    )

  if (!data)
    return (
      <Card>
        <Text tone="muted">Loading loan…</Text>
      </Card>
    )

  const { loan, copy } = data
  const timeline = [
    { label: "Requested", date: data.requestedAt },
    { label: "Collected", date: data.collectedAt },
    { label: "Due", date: loan.dueDate },
    { label: "Returned", date: loan.returnedAt },
  ]

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <TextLink
        to="/my-books"
        className="inline-flex items-center gap-2 self-start"
      >
        <ArrowLeft aria-hidden strokeWidth={1.5} className="size-4" />
        My books
      </TextLink>

      <Card className="flex gap-5">
        <div className="w-20 shrink-0 sm:w-24">
          <BookCover
            title={loan.book.title}
            author={loan.book.authors[0]}
            color={loan.book.coverColor}
            size="sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Heading level={1}>{loan.book.title}</Heading>
          <Text tone="muted" className="mt-1">
            {loan.book.authors.join(", ")}
          </Text>
          <Text mono variant="small" tone="subtle" className="mt-3">
            {copy.barcode}
          </Text>
        </div>
      </Card>

      <div
        className={
          loan.daysOverdue
            ? "rounded-md border border-danger-line bg-danger-bg p-4"
            : "rounded-md border border-info-line bg-info-bg p-4"
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={loan.daysOverdue ? "danger" : "neutral"}>
            {loan.daysOverdue ? "Overdue" : loan.status}
          </Badge>
          <Text weight="medium">
            Due {formatDate(loan.dueDate)} · {dueLabel(loan.dueDate)}
          </Text>
        </div>
      </div>

      <Card>
        <Heading level={2}>Loan timeline</Heading>
        <ol className="mt-5 flex flex-col">
          {timeline.map((item, index) => {
            const complete = Boolean(item.date)
            return (
              <li
                key={item.label}
                className="relative flex gap-3 pb-6 last:pb-0"
              >
                {index < timeline.length - 1 && (
                  <span className="absolute left-2 top-5 h-full w-px bg-line" />
                )}
                <span
                  className={
                    complete
                      ? "relative flex size-4 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary"
                      : "relative size-4 shrink-0 rounded-lg border border-line-input bg-surface"
                  }
                >
                  {complete && (
                    <Check aria-hidden strokeWidth={2} className="size-3" />
                  )}
                </span>
                <div className="-mt-1 flex min-w-0 flex-1 items-start justify-between gap-4">
                  <Text weight="medium">{item.label}</Text>
                  <Text variant="small" tone="muted" className="text-right">
                    {item.date ? formatDate(item.date) : "Not yet"}
                  </Text>
                </div>
              </li>
            )
          })}
        </ol>
      </Card>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Text weight="medium">
            Renewals used: {loan.renewCount} of{" "}
            {settings.data?.maxRenewals ?? 2}
          </Text>
          <Text
            variant="small"
            tone={loan.renewBlockedReason ? "danger" : "muted"}
          >
            {loan.renewBlockedReason ??
              "Renewing adds another loan period from the current due date."}
          </Text>
        </div>
        <Button
          icon={loan.renewBlockedReason ? Clock : RotateCw}
          disabled={
            Boolean(loan.renewBlockedReason) || loan.status !== "active"
          }
          loading={renewing}
          onClick={renew}
        >
          Renew
        </Button>
      </Card>
    </div>
  )
}
