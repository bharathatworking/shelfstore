import { CircleAlert, HandCoins } from "lucide-react"
import { BookIdentity } from "@/components/admin/BookIdentity"
import { Badge } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { useCurrentUser } from "@/context/AuthContext"
import { useAsync } from "@/hooks/useAsync"
import { formatDate, rupees } from "@/lib/format"
import { getMyFines } from "@/services/api"

export function MyFinesPage() {
  const user = useCurrentUser()
  const fines = useAsync(() => getMyFines(user._id), [user._id])
  const data = fines.data

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Heading level={1}>My fines</Heading>
      <Card className="flex items-end justify-between gap-4">
        <div>
          <Text variant="small" tone="muted">
            Outstanding balance
          </Text>
          <Text
            className="mt-1 font-serif text-h1 font-semibold tabular-nums"
            tone={data?.balance ? "danger" : "default"}
          >
            {rupees(data?.balance ?? 0)}
          </Text>
        </div>
        <HandCoins
          aria-hidden
          strokeWidth={1.5}
          className="size-7 text-ink-subtle"
        />
      </Card>

      {data && data.balance >= data.settings.fineBlockThreshold && (
        <div className="flex gap-3 rounded-md border border-danger-line bg-danger-bg p-4">
          <CircleAlert
            aria-hidden
            strokeWidth={1.5}
            className="size-5 shrink-0 text-danger"
          />
          <div>
            <Text weight="medium" tone="danger">
              Borrowing is paused
            </Text>
            <Text variant="small" tone="muted">
              Your balance has reached{" "}
              {rupees(data.settings.fineBlockThreshold)}. Pay at the circulation
              desk to request or borrow books again.
            </Text>
          </div>
        </div>
      )}

      <Text tone="muted">
        Fines are {rupees(data?.settings.finePerDay ?? 5)} per day. Pay at the
        circulation desk.
      </Text>

      <Card padding="none">
        {fines.error ? (
          <AsyncError error={fines.error} onRetry={fines.reload} />
        ) : data?.items.length ? (
          <ul className="divide-y divide-line">
            {data.items.map((fine) => (
              <li
                key={fine._id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <BookIdentity book={fine.book} />
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <Text
                      weight="semibold"
                      tone={
                        fine.status === "outstanding" ? "danger" : "default"
                      }
                    >
                      {rupees(fine.amount)}
                    </Text>
                    <Text variant="small" tone="subtle">
                      {formatDate(fine.date)}
                    </Text>
                  </div>
                  <Badge
                    tone={fine.status === "outstanding" ? "danger" : "neutral"}
                  >
                    {fine.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : fines.loading ? (
          <div className="p-8 text-center text-ink-muted">Loading fines…</div>
        ) : (
          <EmptyState
            icon={HandCoins}
            title="No fines"
            description="Your account has no fine history."
          />
        )}
      </Card>
    </div>
  )
}
