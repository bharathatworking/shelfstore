import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface AdminRefresh {
  version: number
  /** Call after any mutation so the shell's counters (e.g. pending requests) refetch. */
  bump: () => void
}

const Ctx = createContext<AdminRefresh>({ version: 0, bump: () => {} })

export function AdminRefreshProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])
  const value = useMemo(() => ({ version, bump }), [version, bump])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAdminRefresh = () => useContext(Ctx)
