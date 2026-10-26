import { Outlet } from "react-router"
import { BottomTabBar } from "./BottomTabBar"
import { DesktopNav } from "./DesktopNav"
import { TopBar } from "./TopBar"

export function MemberShell() {
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-page">
      <TopBar />
      <DesktopNav />
      <main className="mx-auto min-w-0 max-w-content px-4 pb-28 pt-6 md:px-6 md:pb-16 md:pt-8">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
