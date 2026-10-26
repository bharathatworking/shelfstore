import type { FinePayment } from '@/types'
import { fromNow } from './time'

/** Settlements recorded at return time. Fine amounts themselves are always computed, never stored on loans. */
export const finePayments: FinePayment[] = [
  {
    _id: 'f001',
    loanId: 'l026',
    amount: 10,
    action: 'collected',
    reason: null,
    at: fromNow(0, -4),
  },
]
