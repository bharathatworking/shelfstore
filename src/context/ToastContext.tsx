import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Toaster, type ToastItem, type ToastTone } from '@/components/ui/Toaster'

type Notify = (tone: ToastTone, title: string, description?: string) => void

const ToastContext = createContext<Notify | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const notify = useCallback<Notify>(
    (tone, title, description) => {
      const id = nextId.current++
      setToasts((all) => [...all.slice(-2), { id, tone, title, description }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const value = useMemo(() => notify, [notify])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): Notify {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
