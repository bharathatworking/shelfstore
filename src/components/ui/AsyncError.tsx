import { CircleAlert } from "lucide-react"
import { Button } from "./Button"
import { EmptyState } from "./EmptyState"

export function AsyncError({
  error,
  onRetry,
}: {
  error: Error
  onRetry: () => void
}) {
  return (
    <EmptyState
      icon={CircleAlert}
      title="Could not load this list"
      description={error.message || "Check your connection and try again."}
      action={
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  )
}
