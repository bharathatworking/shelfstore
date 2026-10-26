import {
  AlarmClock,
  BookCopy,
  HandCoins,
  Inbox,
  LayoutDashboard,
  PackageCheck,
  Settings,
  Undo2,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface AdminNavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Page title shown in the top bar. */
  title: string
  countKey?: "pending"
}

export const adminNav: Array<{ group: string | null; items: AdminNavItem[] }> = [
  {
    group: null,
    items: [
      {
        to: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        title: "Dashboard",
      },
    ],
  },
  {
    group: "Catalog",
    items: [
      { to: "/admin/books", label: "Books", icon: BookCopy, title: "Books" },
    ],
  },
  {
    group: "Circulation",
    items: [
      {
        to: "/admin/requests",
        label: "Requests",
        icon: Inbox,
        title: "Requests",
        countKey: "pending",
      },
      {
        to: "/admin/collect",
        label: "Collect hold",
        icon: PackageCheck,
        title: "Collect hold",
      },
      {
        to: "/admin/issue",
        label: "Direct issue",
        icon: UserPlus,
        title: "Direct issue",
      },
      { to: "/admin/return", label: "Return", icon: Undo2, title: "Return" },
      {
        to: "/admin/overdue",
        label: "Overdue",
        icon: AlarmClock,
        title: "Overdue",
      },
    ],
  },
  {
    group: "People",
    items: [
      { to: "/admin/members", label: "Members", icon: Users, title: "Members" },
      { to: "/admin/fines", label: "Fines", icon: HandCoins, title: "Fines" },
    ],
  },
  {
    group: null,
    items: [
      {
        to: "/admin/settings",
        label: "Settings",
        icon: Settings,
        title: "Settings",
      },
    ],
  },
]

export const adminTitle = (pathname: string) => {
  if (pathname === "/admin/books/new") return "Add book"
  if (/^\/admin\/books\/[^/]+\/edit$/.test(pathname)) return "Edit book"
  if (/^\/admin\/books\/[^/]+\/copies$/.test(pathname)) return "Manage copies"
  if (/^\/admin\/members\/[^/]+$/.test(pathname)) return "Member details"
  return (
    adminNav
      .flatMap((g) => g.items)
      .find((i) => i.to === pathname.replace(/\/$/, ""))?.title ?? "Librarian"
  )
}
