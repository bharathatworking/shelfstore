import { AlarmClock, BookOpenCheck, CalendarClock, Inbox } from "lucide-react"
import { ActivityFeed } from "@/components/admin/ActivityFeed"
import { ListSkeleton } from "@/components/admin/ListSkeleton"
import { RejectModal } from "@/components/admin/RejectModal"
import { RequestCard } from "@/components/admin/RequestCard"
import { SectionCard } from "@/components/admin/SectionCard"
import { TodaysReturnsTable } from "@/components/admin/TodaysReturnsTable"
import { useRequestActions } from "@/components/admin/useRequestActions"
import { BarChart } from "@/components/ui/BarChart"
import { AsyncError } from "@/components/ui/AsyncError"
import { EmptyState } from "@/components/ui/EmptyState"
import { Skeleton } from "@/components/ui/Skeleton"
import { StatCard } from "@/components/ui/StatCard"
import { TextLink } from "@/components/ui/TextLink"
import { useAsync } from "@/hooks/useAsync"
import {
  getActivity,
  getAdminStats,
  getBorrowsByDay,
  getTodaysReturns,
  listRequests,
} from "@/services/api"

export function DashboardPage() {
  const stats = useAsync(getAdminStats, [])
  const pending = useAsync(() => listRequests("pending", 5), [])
  const returns = useAsync(getTodaysReturns, [])
  const borrows = useAsync(() => getBorrowsByDay(7), [])
  const activity = useAsync(() => getActivity(8), [])
  const refresh = () => {
    stats.reload()
    pending.reload()
    activity.reload()
  }
  const { busyId, approve, rejecting, setRejecting, reject } =
    useRequestActions(refresh)
  const s = stats.data

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active loans"
          value={s?.activeLoans}
          icon={BookOpenCheck}
        />
        <StatCard
          label="Overdue"
          value={s?.overdue}
          icon={AlarmClock}
          tone={s?.overdue ? "danger" : "default"}
        />
        <StatCard
          label="Pending requests"
          value={s?.pendingRequests}
          icon={Inbox}
        />
        <StatCard
          label="Due back today"
          value={s?.dueToday}
          icon={CalendarClock}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <SectionCard
            title="Pending requests"
            action={
              <TextLink to="/admin/requests" className="text-small">
                View queue
              </TextLink>
            }
          >
            {pending.error ? (
              <AsyncError error={pending.error} onRetry={pending.reload} />
            ) : !pending.data ? (
              <ListSkeleton />
            ) : pending.data.length ? (
              <div className="divide-y divide-line">
                {pending.data.map((v) => (
                  <RequestCard
                    key={v.request._id}
                    view={v}
                    compact
                    busy={busyId === v.request._id}
                    onApprove={() => approve(v)}
                    onReject={() => setRejecting(v)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title="Queue is clear"
                description="New requests that need a decision will show up here."
              />
            )}
          </SectionCard>
          <SectionCard
            title="Today's returns"
            action={
              <TextLink to="/admin/return" className="text-small">
                Check in a book
              </TextLink>
            }
          >
            <TodaysReturnsTable
              rows={returns.data}
              error={returns.error}
              onRetry={returns.reload}
            />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <SectionCard title="Borrows, last 7 days">
            <div className="p-5">
              {borrows.error ? (
                <AsyncError error={borrows.error} onRetry={borrows.reload} />
              ) : borrows.data ? (
                <BarChart
                  label="Books borrowed per day over the last 7 days"
                  data={borrows.data.map((d) => ({
                    label: new Date(d.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                    }),
                    value: d.count,
                  }))}
                />
              ) : (
                <Skeleton className="h-44" />
              )}
            </div>
          </SectionCard>
          <SectionCard title="Recent activity">
            <ActivityFeed
              items={activity.data}
              error={activity.error}
              onRetry={activity.reload}
            />
          </SectionCard>
        </div>
      </div>

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
