import type { Book } from '@/types'
import { Text } from './ui/Text'

export function AvailabilityText({ book }: { book: Book }) {
  return book.availableCopies > 0 ? (
    <Text variant="small" tone="success" as="span">
      {book.availableCopies} of {book.totalCopies} available
    </Text>
  ) : (
    <Text variant="small" tone="subtle" as="span">
      All copies borrowed
    </Text>
  )
}
