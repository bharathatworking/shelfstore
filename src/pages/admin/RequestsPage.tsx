import { CircleCheck, CircleX, Inbox } from "lucide-react"
import { useSearchParams } from "react-router"
import { ListSkeleton } from "@/components/admin/ListSkeleton"
import { RejectModal } from "@/components/admin/RejectModal"
import { RequestCard } from "@/components/admin/RequestCard"
import { useRequestActions } from "@/components/admin/useRequestActions"
import { Card } from "@/components/ui/Card"
import { AsyncError } from "@/components/ui/AsyncError"
import { EmptyState } from "@/components/ui/EmptyState"
import { Tabs } from "@/components/ui/Tabs"
import { useAdminRefresh } from "@/context/AdminRefreshContext"
import { useAsync } from "@/hooks/useAsync"
import { getRequestCounts, listRequests, type QueueTab } from "@/services/api"

const empty = {
  pending: {
    icon: Inbox,
    title: "No pending requests",
    description:
      "Flagged and waitlisted requests will wait here for a decision.",
  },
  approved: {
    icon: CircleCheck,
    title: "No holds waiting",
    description:
      "Approved requests stay here until the student collects the book.",
  },
  rejected: {
    icon: CircleX,
    title: "Nothing rejected",
    description: "Rejected requests and their reasons will be listed here.",
  },
}

export function RequestsPage() {
  const [params, setParams] = useSearchParams()
  const tab = (
    ["pending", "approved", "rejected"].includes(params.get("tab") ?? "")
      ? params.get("tab")
      : "pending"
  ) as QueueTab
  const { version } = useAdminRefresh()
  const list = useAsync(() => listRequests(tab), [tab, version])
  const counts = useAsync(getRequestCounts, [version])
  const { busyId, approve, rejecting, setRejecting, reject } =
    useRequestActions(list.reload)
  const e = empty[tab]

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        label="Request status"
        value={tab}
        onChange={(t) =>
          setParams(t === "pending" ? {} : { tab: t }, { replace: true })
        }
        tabs={[
          { id: "pending", label: "Pending", count: counts.data?.pending },
          { id: "approved", label: "Approved", count: counts.data?.approved },
          { id: "rejected", label: "Rejected", count: counts.data?.rejected },
        ]}
      />
      {list.error ? (
        <Card padding="none">
          <AsyncError error={list.error} onRetry={list.reload} />
        </Card>
      ) : list.loading && !list.data ? (
        <Card padding="none">
          <ListSkeleton rows={4} />
        </Card>
      ) : list.data?.length ? (
        <div className="flex flex-col gap-3">
          {list.data.map((v) => (
            <RequestCard
              key={v.request._id}
              view={v}
              busy={busyId === v.request._id}
              onApprove={() => approve(v)}
              onReject={() => setRejecting(v)}
            />
          ))}
        </div>
      ) : (
        <Card padding="none">
          <EmptyState
            icon={e.icon}
            title={e.title}
            description={e.description}
          />
        </Card>
      )}
      <RejectModal
        open={Boolean(rejecting)}
        subject={
          rejecting
            ? `${rejecting.user.name} requested ${rejecting.book.title}`
            : ""
        }
        onClose={() => setRejecting(null)}
        onConfirm={reject}
      />
    </div>
  )
}
