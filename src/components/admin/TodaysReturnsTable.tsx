import { Undo2 } from "lucide-react"
import type { ReturnedToday } from "@/services/api"
import { formatTime, rupees } from "@/lib/format"
import { Badge } from "../ui/Badge"
import { AsyncError } from "../ui/AsyncError"
import { DataTable } from "../ui/DataTable"
import { EmptyState } from "../ui/EmptyState"
import { BookIdentity } from "./BookIdentity"
import { ListSkeleton } from "./ListSkeleton"

export function TodaysReturnsTable({
  rows,
  error,
  onRetry,
}: {
  rows: ReturnedToday[] | undefined
  error?: Error | null
  onRetry?: () => void
}) {
  if (error && onRetry) return <AsyncError error={error} onRetry={onRetry} />
  if (!rows) return <ListSkeleton rows={2} />
  if (!rows.length)
    return (
      <EmptyState
        icon={Undo2}
        title="No returns yet today"
        description="Books checked in at the desk will be listed here."
      />
    )
  return (
    <DataTable
      label="Today's returns"
      rows={rows}
      rowKey={(r) => r.loan._id}
      defaultSort={{ key: "time", dir: "desc" }}
      dense
      mobileTitle={(r) => <BookIdentity book={r.book} code={r.copy.barcode} />}
      mobileFields={[{ key: "student" }, { key: "fine" }, { key: "time" }]}
      mobileStatus={(r) =>
        r.copy.status === "damaged" ? (
          <Badge tone="warning">Damaged</Badge>
        ) : (
          <Badge tone="success">Returned</Badge>
        )
      }
      columns={[
        {
          key: "book",
          header: "Book",
          className: "min-w-0",
          render: (r) => <BookIdentity book={r.book} code={r.copy.barcode} />,
        },
        {
          key: "student",
          header: "Student",
          className: "w-28 truncate whitespace-nowrap",
          render: (r) => r.user.name,
          sortValue: (r) => r.user.name,
        },
        {
          key: "condition",
          header: "Condition",
          className: "w-24 whitespace-nowrap",
          render: (r) =>
            r.copy.status === "damaged" ? (
              <Badge tone="warning">Damaged</Badge>
            ) : (
              <span className="capitalize text-ink-muted">
                {r.copy.condition}
              </span>
            ),
        },
        {
          key: "fine",
          header: "Fine",
          align: "right",
          className: "w-16 whitespace-nowrap",
          render: (r) =>
            r.payment ? (
              <span
                className={
                  r.payment.action === "waived"
                    ? "text-ink-subtle line-through"
                    : "text-ink"
                }
              >
                {rupees(r.payment.amount)}
              </span>
            ) : (
              <span className="text-ink-subtle">None</span>
            ),
        },
        {
          key: "time",
          header: "Returned",
          align: "right",
          className: "w-20 whitespace-nowrap",
          render: (r) => formatTime(r.loan.returnedAt!),
          sortValue: (r) => r.loan.returnedAt!,
        },
      ]}
    />
  )
}
