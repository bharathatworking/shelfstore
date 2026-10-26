import { AlarmClock, BellRing } from "lucide-react"
import { useMemo, useState } from "react"
import { BookIdentity } from "@/components/admin/BookIdentity"
import { ListSkeleton } from "@/components/admin/ListSkeleton"
import { MemberIdentity } from "@/components/admin/MemberIdentity"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { Card } from "@/components/ui/Card"
import { cx } from "@/components/ui/cx"
import { DataTable } from "@/components/ui/DataTable"
import { EmptyState } from "@/components/ui/EmptyState"
import { FilterChip } from "@/components/ui/FilterChip"
import { Text } from "@/components/ui/Text"
import { useAdminRefresh } from "@/context/AdminRefreshContext"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { formatDate, rupees, timeAgo } from "@/lib/format"
import { getOverdue, sendReminders, type OverdueRow } from "@/services/api"

const ranges = [
  { id: "all", label: "All", test: () => true },
  { id: "week", label: "1–7 days", test: (d: number) => d <= 7 },
  { id: "month", label: "8–30 days", test: (d: number) => d > 7 && d <= 30 },
  { id: "long", label: "30+ days", test: (d: number) => d > 30 },
] as const
type RangeId = typeof ranges[number]["id"]

function Summary({
  label,
  value,
  danger,
}: {
  label: string
  value: string | number
  danger?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 p-4 md:p-5 lg:px-6 lg:first:pl-0">
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <span
        className={cx(
          "font-serif text-h1 font-semibold tabular-nums",
          danger ? "text-danger" : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function OverduePage() {
  const toast = useToast()
  const { version, bump } = useAdminRefresh()
  const overdue = useAsync(getOverdue, [version])
  const [range, setRange] = useState<RangeId>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState<string | null>(null)

  const all = useMemo(() => overdue.data ?? [], [overdue.data])
  const rows = useMemo(
    () =>
      all.filter((r) =>
        ranges.find((x) => x.id === range)!.test(r.daysOverdue),
      ),
    [all, range],
  )
  const students = new Set(all.map((r) => r.user._id)).size
  const totalFines = all.reduce((s, r) => s + r.fine, 0)
  const loaded = Boolean(overdue.data)

  const remind = async (ids: string[], key: string) => {
    setSending(key)
    try {
      const n = await sendReminders(ids)
      toast(
        "success",
        n === 1 ? "Reminder sent" : `${n} reminders sent`,
        "Students get an email and an in-app notice.",
      )
      setSelected(new Set())
      bump()
    } catch (err) {
      toast("danger", "Could not send", (err as Error).message)
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card padding="none">
        <div className="grid grid-cols-1 divide-y divide-line px-2 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-6">
          <Summary
            label="Books overdue"
            value={loaded ? all.length : "–"}
            danger={all.length > 0}
          />
          <Summary label="Students" value={loaded ? students : "–"} />
          <Summary
            label="Fines accrued"
            value={loaded ? rupees(totalFines) : "–"}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-2">
          {ranges.map((r) => (
            <FilterChip
              key={r.id}
              label={r.label}
              active={range === r.id}
              count={
                loaded
                  ? all.filter((x) => r.test(x.daysOverdue)).length
                  : undefined
              }
              onClick={() => {
                setRange(r.id)
                setSelected(new Set())
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 md:ml-auto">
          {selected.size > 0 && (
            <Text variant="small" tone="muted" className="tabular-nums">
              {selected.size} selected
            </Text>
          )}
          <Button
            icon={BellRing}
            size="sm"
            disabled={!selected.size}
            loading={sending === "bulk"}
            onClick={() => remind([...selected], "bulk")}
            className="ml-auto md:ml-0"
          >
            Send reminders
          </Button>
        </div>
      </div>

      <Card padding="none">
        {overdue.error ? (
          <AsyncError error={overdue.error} onRetry={overdue.reload} />
        ) : !loaded ? (
          <ListSkeleton rows={5} />
        ) : rows.length ? (
          <DataTable<OverdueRow>
            label="Overdue loans"
            rows={rows}
            rowKey={(r) => r.loan._id}
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            defaultSort={{ key: "days", dir: "desc" }}
            mobileTitle={(r) => (
              <BookIdentity book={r.book} code={r.copy.barcode} />
            )}
            mobileFields={[{ key: "student" }, { key: "due" }, { key: "fine" }]}
            mobileStatus={() => <Badge tone="danger">Overdue</Badge>}
            columns={[
              {
                key: "student",
                header: "Student",
                render: (r) => <MemberIdentity user={r.user} />,
                sortValue: (r) => r.user.name,
              },
              {
                key: "book",
                header: "Book",
                render: (r) => (
                  <BookIdentity book={r.book} code={r.copy.barcode} />
                ),
                sortValue: (r) => r.book.title,
              },
              {
                key: "due",
                header: "Due",
                render: (r) => formatDate(r.loan.dueDate),
                sortValue: (r) => r.loan.dueDate,
              },
              {
                key: "days",
                header: "Days late",
                align: "right",
                render: (r) => (
                  <span
                    className={
                      r.daysOverdue > 30
                        ? "font-medium text-danger"
                        : "text-ink"
                    }
                  >
                    {r.daysOverdue}
                  </span>
                ),
                sortValue: (r) => r.daysOverdue,
              },
              {
                key: "fine",
                header: "Fine",
                align: "right",
                render: (r) => rupees(r.fine),
                sortValue: (r) => r.fine,
              },
              {
                key: "reminded",
                header: "Last reminder",
                render: (r) => (
                  <span className="text-ink-muted">
                    {r.lastRemindedAt ? timeAgo(r.lastRemindedAt) : "Never"}
                  </span>
                ),
                sortValue: (r) => r.lastRemindedAt ?? "",
              },
            ]}
            actions={(r) => (
              <Button
                variant="secondary"
                size="sm"
                icon={BellRing}
                loading={sending === r.loan._id}
                onClick={() => remind([r.loan._id], r.loan._id)}
              >
                Remind
              </Button>
            )}
          />
        ) : (
          <EmptyState
            icon={AlarmClock}
            title={all.length ? "Nothing in this range" : "Nothing overdue"}
            description={
              all.length
                ? "Try another range to see the rest of the overdue loans."
                : "Every borrowed book is within its due date."
            }
          />
        )}
      </Card>
    </div>
  )
}
