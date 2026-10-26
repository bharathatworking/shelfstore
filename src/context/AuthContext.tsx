import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import * as api from "@/services/api"
import type { User } from "@/types"

interface AuthValue {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  signup: (input: {
    name: string
    email: string
    usn: string
    password: string
  }) => Promise<User>
  updateAccount: (input: { name: string email: string }) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback(async (email: string) => {
    const u = await api.login(email)
    setUser(u)
    return u
  }, [])

  const signup = useCallback(
    async (input: { name: string email: string usn: string }) => {
      const u = await api.signup(input)
      setUser(u)
      return u
    },
    [],
  )

  const logout = useCallback(() => setUser(null), [])

  const updateAccount = useCallback(
    async (input: { name: string email: string }) => {
      if (!user) throw new Error("No signed-in user")
      const updated = await api.updateProfile(user._id, input)
      setUser(updated)
      return updated
    },
    [user],
  )

  const value = useMemo(
    () => ({ user, login, signup, updateAccount, logout }),
    [user, login, signup, updateAccount, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

/** For screens behind RequireAuth, where a user is guaranteed. */
export function useCurrentUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error("No signed-in user")
  return user
}
