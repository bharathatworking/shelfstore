import { useState } from "react"
import { Outlet } from "react-router"
import { AdminRefreshProvider } from "@/context/AdminRefreshContext"
import { AdminSidebar } from "./AdminSidebar"
import { AdminTopBar } from "./AdminTopBar"

export function AdminShell() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <AdminRefreshProvider>
      <div className="admin-shell flex min-h-screen max-w-full overflow-x-hidden bg-page">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-ink/40"
              onClick={() => setNavOpen(false)}
            />
            <div className="relative h-full w-full shadow-pop md:w-sidebar">
              <AdminSidebar drawer onNavigate={() => setNavOpen(false)} />
            </div>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBar onOpenNav={() => setNavOpen(true)} />
          <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminRefreshProvider>
  )
}
