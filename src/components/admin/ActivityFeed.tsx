import { Activity } from "lucide-react"
import type { ActivityView } from "@/services/api"
import type { ActivityType } from "@/types"
import { timeAgo } from "@/lib/format"
import { EmptyState } from "../ui/EmptyState"
import { AsyncError } from "../ui/AsyncError"
import { Skeleton } from "../ui/Skeleton"

const verbs: Record<ActivityType, string> = {
  collected: "collected",
  issued: "was issued",
  returned: "returned",
  requested: "requested",
  approved: "was approved for",
  rejected: "was declined for",
  reminded: "was reminded about",
}

export function ActivityFeed({
  items,
  error,
  onRetry,
}: {
  items: ActivityView[] | undefined
  error?: Error | null
  onRetry?: () => void
}) {
  if (error && onRetry) return <AsyncError error={error} onRetry={onRetry} />
  if (!items)
    return (
      <div className="flex flex-col gap-4 p-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
    )
  if (!items.length)
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Desk actions will appear here as they happen."
      />
    )
  return (
    <ol className="divide-y divide-line">
      {items.map((a) => (
        <li key={a._id} className="px-5 py-3">
          <p className="text-body text-ink">
            <span className="font-medium">{a.userName}</span> {verbs[a.type]}{" "}
            <span className="font-serif font-semibold">{a.bookTitle}</span>
            <span className="text-ink-subtle"> · {timeAgo(a.at)}</span>
          </p>
          {a.note && (
            <p className="mt-0.5 text-small text-ink-muted">{a.note}</p>
          )}
        </li>
      ))}
    </ol>
  )
}
