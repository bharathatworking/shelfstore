import type { Reminder } from '@/types'
import { fromNow } from './time'

export const reminders: Reminder[] = [
  { _id: 'm001', loanId: 'l006', sentAt: fromNow(-3) },
  { _id: 'm002', loanId: 'l027', sentAt: fromNow(-10) },
  { _id: 'm003', loanId: 'l027', sentAt: fromNow(-2) },
]
