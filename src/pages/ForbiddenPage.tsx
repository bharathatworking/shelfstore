import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-6">
      <EmptyState
        icon={ShieldX}
        title="You don’t have access to this shelf"
        description="The librarian workspace is only available to library staff."
        action={<Button to="/browse">Return to browse</Button>}
      />
    </div>
  )
}
