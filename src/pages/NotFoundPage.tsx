import { LibraryBig } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"

export function NotFoundPage() {
  return (
    <EmptyState
      icon={LibraryBig}
      title="This shelf is empty"
      description="The page may have moved or the link may be incorrect."
      action={<Button to="/browse">Go to browse</Button>}
    />
  )
}
