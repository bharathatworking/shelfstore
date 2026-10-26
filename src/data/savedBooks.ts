import type { SavedBook } from '@/types'
import { fromNow } from './time'

export const savedBooks: SavedBook[] = [
  { _id: 's001', userId: 'u001', bookId: 'b011', savedAt: fromNow(-6) },
  { _id: 's002', userId: 'u001', bookId: 'b043', savedAt: fromNow(-3) },
  { _id: 's003', userId: 'u001', bookId: 'b032', savedAt: fromNow(-1) },
]
