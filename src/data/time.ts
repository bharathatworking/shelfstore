const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

/** ISO timestamp relative to now, so seeded states (due soon, overdue) stay true on any date. */
export function fromNow(days: number, hours = 0): string {
  return new Date(Date.now() + days * DAY + hours * HOUR).toISOString()
}
