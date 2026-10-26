import { X } from "lucide-react"
import { NavLink } from "react-router"
import { useAdminRefresh } from "@/context/AdminRefreshContext"
import { useAsync } from "@/hooks/useAsync"
import { getRequestCounts } from "@/services/api"
import { Wordmark } from "../Wordmark"
import { IconButton } from "../ui/IconButton"
import { cx } from "../ui/cx"
import { adminNav } from "./adminNav"

export function AdminSidebar({
  onNavigate,
  drawer = false,
}: {
  onNavigate?: () => void
  drawer?: boolean
}) {
  const { version } = useAdminRefresh()
  const counts = useAsync(getRequestCounts, [version])
  return (
    <aside
      className={cx(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-surface",
        drawer ? "w-full md:w-sidebar" : "w-sidebar",
      )}
    >
      <div className="flex h-16 items-center px-5">
        <Wordmark to="/admin" />
        {drawer && (
          <IconButton
            icon={X}
            label="Close navigation"
            onClick={onNavigate}
            className="ml-auto"
          />
        )}
      </div>
      <nav aria-label="Librarian" className="flex-1 overflow-y-auto px-3 pb-6">
        {adminNav.map((group, gi) => (
          <div key={gi} className="mt-5 first:mt-2">
            {group.group && (
              <p className="mb-1.5 px-3 text-caption font-medium uppercase tracking-wider text-ink-subtle">
                {group.group}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map(({ to, label, icon: Icon, countKey }) => {
                const count = countKey ? counts.data?.[countKey] : undefined
                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === "/admin"}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cx(
                          "flex h-11 items-center gap-2.5 rounded-md px-3 text-body transition-colors lg:h-9",
                          isActive
                            ? "bg-primary-tint font-medium text-primary"
                            : "text-ink-muted hover:bg-hover hover:text-ink",
                        )
                      }
                    >
                      <Icon aria-hidden strokeWidth={1.5} className="size-4" />
                      <span className="flex-1">{label}</span>
                      {count ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-lg bg-primary px-1.5 text-caption font-semibold tabular-nums text-on-primary">
                          {count}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
