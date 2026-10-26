const locale = 'en-IN'

/** "28 Oct 2025" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "Wed 28 Oct" */
export function formatDay(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString(locale, { weekday: 'short' })} ${d.getDate()} ${d.toLocaleDateString(locale, { month: 'short' })}`
}

/** "Wed 28 Oct, 5:00 PM" */
export function formatDayTime(iso: string): string {
  const time = new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${formatDay(iso)}, ${time}`
}

/** Whole days from today to the given date (negative if past). */
export function daysUntil(iso: string): number {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(iso)
  end.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

export function dueLabel(iso: string): string {
  const d = daysUntil(iso)
  if (d < 0) return `${-d} ${-d === 1 ? 'day' : 'days'} overdue`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  return `Due in ${d} days`
}

export const firstName = (name: string) => name.replace(/^(mrs?|ms|dr)\.?\s+/i, '').split(/\s+/)[0]

export function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export const formatAuthors = (authors: string[]) =>
  authors.length <= 2 ? authors.join(' and ') : `${authors[0]} and ${authors.length - 1} others`

export const rupees = (n: number) => `₹${n.toLocaleString(locale)}`

/** "10 min ago", "3 h ago", "2 days ago" */
export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

/** "5:00 PM" */
export const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
