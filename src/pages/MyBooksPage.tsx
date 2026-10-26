import { BookOpen, Clock, History } from "lucide-react"
import { useState } from "react"
import { useSearchParams } from "react-router"
import { BookRowSkeleton } from "@/components/BookRowSkeleton"
import { HistoryRow } from "@/components/HistoryRow"
import { LoanRow } from "@/components/LoanRow"
import { RequestRow } from "@/components/RequestRow"
import { Button } from "@/components/ui/Button"
import { AsyncError } from "@/components/ui/AsyncError"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Heading } from "@/components/ui/Heading"
import { Skeleton } from "@/components/ui/Skeleton"
import { Tabs } from "@/components/ui/Tabs"
import { Text } from "@/components/ui/Text"
import { useCurrentUser } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { formatDate, rupees } from "@/lib/format"
import {
  cancelRequest,
  getMyBooks,
  getSettings,
  renewLoan,
} from "@/services/api"

type TabId = "active" | "requests" | "history"

export function MyBooksPage() {
  const user = useCurrentUser()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tab = (
    ["active", "requests", "history"].includes(params.get("tab") ?? "")
      ? params.get("tab")
      : "active"
  ) as TabId
  const my = useAsync(() => getMyBooks(user._id), [user._id])
  const settings = useAsync(getSettings, [])
  const [busyId, setBusyId] = useState<string | null>(null)

  const renew = async (loanId: string) => {
    setBusyId(loanId)
    try {
      const updated = await renewLoan(user._id, loanId)
      toast(
        "success",
        "Loan renewed",
        `${updated.book.title} is now due ${formatDate(updated.dueDate)}.`,
      )
      my.reload()
    } catch (err) {
      toast("danger", "Could not renew", (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const cancel = async (requestId: string, title: string) => {
    setBusyId(requestId)
    try {
      await cancelRequest(user._id, requestId)
      toast("info", "Request cancelled", title)
      my.reload()
    } catch (err) {
      toast("danger", "Could not cancel", (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const data = my.data
  const firstLoad = my.loading && !data
  const used = data
    ? data.active.length +
      data.requests.filter((r) => r.status === "approved").length
    : 0

  const list = (() => {
    if (my.error) return <AsyncError error={my.error} onRetry={my.reload} />
    if (firstLoad)
      return (
        <ul className="divide-y divide-line">
          {Array.from({ length: 3 }, (_, i) => (
            <BookRowSkeleton key={i} />
          ))}
        </ul>
      )
    if (!data) return null
    if (tab === "active")
      return data.active.length ? (
        <ul className="divide-y divide-line">
          {data.active.map((l) => (
            <LoanRow
              key={l._id}
              loan={l}
              maxRenewals={settings.data?.maxRenewals ?? 2}
              renewing={busyId === l._id}
              onRenew={() => renew(l._id)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No books borrowed"
          description="Books you collect from the desk will appear here with their due dates."
          action={<Button to="/browse">Browse the catalogue</Button>}
        />
      )
    if (tab === "requests")
      return data.requests.length ? (
        <ul className="divide-y divide-line">
          {data.requests.map((r) => (
            <RequestRow
              key={r._id}
              request={r}
              cancelling={busyId === r._id}
              onCancel={() => cancel(r._id, r.book.title)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Clock}
          title="No open requests"
          description="Reserve a book and it will wait for you on the shelf for 48 hours."
          action={
            <Button variant="secondary" to="/browse">
              Find a book
            </Button>
          }
        />
      )
    return data.history.length ? (
      <ul className="divide-y divide-line">
        {data.history.map((h) => (
          <HistoryRow key={h._id} entry={h} />
        ))}
      </ul>
    ) : (
      <EmptyState
        icon={History}
        title="No history yet"
        description="Returned books and past requests will show up here."
      />
    )
  })()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Heading level={1}>My books</Heading>
          <div className="mt-1 h-5">
            {data ? (
              <Text variant="small" tone="muted">
                {used} of {data.limit} books out or on hold
              </Text>
            ) : (
              <Skeleton className="h-4 w-44" />
            )}
          </div>
        </div>
        {data && data.totalFines > 0 && (
          <Card padding="none" className="px-4 py-2.5">
            <Text variant="small" tone="muted" as="span">
              Outstanding fines{" "}
            </Text>
            <Text variant="body" tone="danger" weight="semibold" as="span">
              {rupees(data.totalFines)}
            </Text>
            <Text variant="small" tone="subtle" as="span">
              {" "}
              · pay at the desk
            </Text>
          </Card>
        )}
      </header>

      <Tabs
        label="My books"
        value={tab}
        onChange={(t) =>
          setParams(t === "active" ? {} : { tab: t }, { replace: true })
        }
        tabs={[
          { id: "active", label: "Active", count: data?.active.length },
          { id: "requests", label: "Requests", count: data?.requests.length },
          { id: "history", label: "History", count: data?.history.length },
        ]}
      />

      <Card padding="none" as="section">
        {list}
      </Card>
    </div>
  )
}
