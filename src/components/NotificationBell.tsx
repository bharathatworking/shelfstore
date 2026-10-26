import { Bell } from "lucide-react"
import { useLocation } from "react-router"
import { useCurrentUser } from "@/context/AuthContext"
import { useAsync } from "@/hooks/useAsync"
import { getAlerts } from "@/services/api"
import { IconButton } from "./ui/IconButton"

export function NotificationBell() {
  const user = useCurrentUser()
  const { pathname } = useLocation()
  const { data } = useAsync(() => getAlerts(user._id), [user._id, pathname])
  const count = data ? data.overdue + data.dueSoon + data.readyToCollect : 0
  return (
    <IconButton
      icon={Bell}
      to="/notifications"
      label={count ? `${count} updates on your books` : "Notifications"}
      badge={
        count > 0 ? (
          <span
            aria-hidden
            className="absolute right-2 top-2 size-2 rounded-lg border-2 border-surface bg-danger"
          />
        ) : null
      }
    />
  )
}
