import type { Settings } from '@/types'

export const settings: Settings = {
  loanPeriodDays: 14,
  maxBooksPerUser: 3,
  maxRenewals: 2,
  finePerDay: 5,
  fineBlockThreshold: 100,
  holdHours: 48,
  requireManualApproval: false,
}
