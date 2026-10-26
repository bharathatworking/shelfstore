import { Bell } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/Button"
import { AsyncError } from "@/components/ui/AsyncError"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Heading } from "@/components/ui/Heading"
import { Text } from "@/components/ui/Text"
import { useCurrentUser } from "@/context/AuthContext"
import { useAsync } from "@/hooks/useAsync"
import { timeAgo } from "@/lib/format"
import {
  getNotifications,
  markAllNotificationsRead,
  type MemberNotification,
} from "@/services/api"

const groupFor = (item: MemberNotification) => {
  const days = Math.floor(
    (Date.now() - new Date(item.at).getTime()) / (24 * 60 * 60 * 1000),
  )
  if (days <= 0) return "Today"
  if (days <= 7) return "This week"
  return "Earlier"
}

export function NotificationsPage() {
  const user = useCurrentUser()
  const notifications = useAsync(() => getNotifications(user._id), [user._id])
  const rows = notifications.data ?? []
  const groups = ["Today", "This week", "Earlier"].map((label) => ({
    label,
    items: rows.filter((item) => groupFor(item) === label),
  }))

  const markAll = async () => {
    await markAllNotificationsRead(user._id)
    notifications.reload()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <Heading level={1}>Notifications</Heading>
        {rows.some((item) => !item.read) && (
          <Button variant="secondary" size="sm" onClick={markAll}>
            Mark all read
          </Button>
        )}
      </header>

      {notifications.error ? (
        <Card padding="none">
          <AsyncError
            error={notifications.error}
            onRetry={notifications.reload}
          />
        </Card>
      ) : rows.length ? (
        groups
          .filter((group) => group.items.length)
          .map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <Heading level={3}>{group.label}</Heading>
              <Card padding="none">
                <ul className="divide-y divide-line">
                  {group.items.map((item) => (
                    <li key={item._id}>
                      <Link
                        to={item.to}
                        className="flex min-h-16 items-start gap-3 px-4 py-4 transition-colors hover:bg-hover sm:px-5"
                      >
                        <span
                          aria-hidden
                          className={
                            item.read
                              ? "mt-2 size-2 shrink-0 rounded-lg bg-line"
                              : "mt-2 size-2 shrink-0 rounded-lg bg-primary"
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <Text weight={item.read ? "normal" : "semibold"}>
                            {item.title}
                          </Text>
                          <Text variant="small" tone="muted">
                            {item.description}
                          </Text>
                        </div>
                        <Text
                          variant="small"
                          tone="subtle"
                          className="shrink-0"
                        >
                          {timeAgo(item.at)}
                        </Text>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))
      ) : notifications.loading ? (
        <Card>
          <Text tone="muted">Loading notifications…</Text>
        </Card>
      ) : (
        <Card padding="none">
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="Due dates, holds and account updates will appear here."
          />
        </Card>
      )}
    </div>
  )
}
