import { useState } from 'react'
import { useAdminRefresh } from '@/context/AdminRefreshContext'
import { useToast } from '@/context/ToastContext'
import { formatDayTime } from '@/lib/format'
import {
  approveRequest,
  rejectRequest,
  type AdminRequestView,
} from '@/services/api'

/** Approve / reject handlers shared by the dashboard and the requests queue. */
export function useRequestActions(onDone: () => void) {
  const toast = useToast()
  const { bump } = useAdminRefresh()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<AdminRequestView | null>(null)

  const approve = async (view: AdminRequestView) => {
    setBusyId(view.request._id)
    try {
      const result = await approveRequest(view.request._id)
      toast(
        'success',
        'Request approved',
        `${result.copy?.barcode} held for ${view.user.name} until ${formatDayTime(result.request.holdExpiresAt!)}.`,
      )
      onDone()
      bump()
    } catch (err) {
      toast('danger', 'Could not approve', (err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const reject = async (reason: string) => {
    if (!rejecting) return
    try {
      await rejectRequest(rejecting.request._id, reason)
      toast(
        'info',
        'Request rejected',
        `${rejecting.user.name} · ${rejecting.book.title}`,
      )
      setRejecting(null)
      onDone()
      bump()
    } catch (err) {
      toast('danger', 'Could not reject', (err as Error).message)
    }
  }

  return { busyId, approve, rejecting, setRejecting, reject }
}
