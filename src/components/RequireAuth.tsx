import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"
import { useAuth } from "@/context/AuthContext"
import { ForbiddenPage } from "@/pages/ForbiddenPage"
import type { Role } from "@/types"

export function RequireAuth({
  role,
  children,
}: {
  role: Role
  children: ReactNode
}) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role)
    return user.role === "student" && role === "admin" ? (
      <ForbiddenPage />
    ) : (
      <Navigate to="/admin" replace />
    )
  return <>{children}</>
}
