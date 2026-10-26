import { LogOut, Menu as MenuIcon } from "lucide-react"
import { useLocation, useNavigate } from "react-router"
import { useAuth, useCurrentUser } from "@/context/AuthContext"
import { Avatar } from "../ui/Avatar"
import { Heading } from "../ui/Heading"
import { IconButton } from "../ui/IconButton"
import { Menu } from "../ui/Menu"
import { Text } from "../ui/Text"
import { AdminSearch } from "./AdminSearch"
import { adminTitle } from "./adminNav"

export function AdminTopBar({ onOpenNav }: { onOpenNav: () => void }) {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <header className="sticky top-0 z-40 flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface px-4 py-2 md:flex-nowrap md:gap-6 md:px-6 md:py-0 lg:px-8">
      <IconButton
        icon={MenuIcon}
        label="Open navigation"
        onClick={onOpenNav}
        className="lg:hidden"
      />
      <Heading level={1} className="min-w-0 flex-1 truncate md:flex-none">
        {adminTitle(pathname)}
      </Heading>
      <div className="order-last flex w-full md:order-none md:flex md:flex-1 md:justify-end">
        <AdminSearch />
      </div>
      <Menu
        label="Account"
        trigger={<Avatar name={user.name} />}
        header={
          <>
            <Text weight="medium">{user.name}</Text>
            <Text variant="small" tone="subtle">
              {user.email}
            </Text>
          </>
        }
        items={[
          {
            label: "Sign out",
            icon: LogOut,
            onSelect: () => {
              logout()
              navigate("/login", { replace: true })
            },
          },
        ]}
      />
    </header>
  )
}
