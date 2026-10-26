import type { ActivityEvent } from '@/types'
import { fromNow } from './time'

export const activity: ActivityEvent[] = [
  {
    _id: 'a001',
    type: 'collected',
    userId: 'u006',
    bookId: 'b002',
    at: fromNow(0, -10 / 60),
    note: null,
  },
  {
    _id: 'a002',
    type: 'requested',
    userId: 'u003',
    bookId: 'b021',
    at: fromNow(0, -2),
    note: null,
  },
  {
    _id: 'a003',
    type: 'returned',
    userId: 'u005',
    bookId: 'b007',
    at: fromNow(0, -2),
    note: null,
  },
  {
    _id: 'a004',
    type: 'returned',
    userId: 'u002',
    bookId: 'b031',
    at: fromNow(0, -4),
    note: '₹10 fine collected',
  },
  {
    _id: 'a005',
    type: 'requested',
    userId: 'u004',
    bookId: 'b006',
    at: fromNow(0, -5),
    note: null,
  },
  {
    _id: 'a006',
    type: 'approved',
    userId: 'u001',
    bookId: 'b003',
    at: fromNow(0, -18),
    note: null,
  },
  {
    _id: 'a007',
    type: 'collected',
    userId: 'u007',
    bookId: 'b013',
    at: fromNow(-2),
    note: null,
  },
]
