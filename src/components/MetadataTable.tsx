import type { Book } from '@/types'
import { Text } from './ui/Text'

export function MetadataTable({ book, loanDays }: { book: Book; loanDays: number }) {
  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: 'Shelf', value: book.shelfLocation, mono: true },
    { label: 'ISBN', value: book.isbn, mono: true },
    { label: 'Publisher', value: book.publisher },
    { label: 'Year', value: String(book.year) },
    { label: 'Language', value: book.language },
    { label: 'Subject', value: book.genres.join(', ') },
    { label: 'Loan period', value: `${loanDays} days` },
  ]
  return (
    <dl className="grid grid-cols-1 border-y border-line sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline gap-4 border-b border-line py-2.5 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
          <Text as="dt" variant="small" tone="subtle" className="w-24 shrink-0">
            {r.label}
          </Text>
          <Text as="dd" mono={r.mono}>
            {r.value}
          </Text>
        </div>
      ))}
    </dl>
  )
}
