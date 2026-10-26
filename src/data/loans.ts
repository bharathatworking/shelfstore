import type { Loan } from '@/types'
import { fromNow } from './time'

function loan(_id: string, userId: string, copyId: string, issuedDaysAgo: number, returnedDaysAgo: number | null, renewCount = 0): Loan {
  const issued = -issuedDaysAgo
  return {
    _id,
    userId,
    bookId: copyId.split('-')[0],
    copyId,
    issuedAt: fromNow(issued),
    dueDate: fromNow(issued + 14 * (renewCount + 1)),
    returnedAt: returnedDaysAgo === null ? null : fromNow(-returnedDaysAgo),
    renewCount,
    status: returnedDaysAgo === null ? 'active' : 'returned',
  }
}

export const loans: Loan[] = [
  // Keshav: one due in 2 days, plus history
  loan('l001', 'u001', 'b001-c1', 12, null),
  loan('l002', 'u001', 'b002-c2', 40, 27),
  loan('l003', 'u001', 'b031-c1', 22, 10),
  loan('l004', 'u001', 'b010-c1', 70, 58, 1),
  // Two overdue loans
  loan('l005', 'u002', 'b026-c1', 20, null),
  loan('l006', 'u003', 'b015-c2', 38, null),
  loan('l007', 'u002', 'b043-c1', 5, null),
  // Divya is at the 3-book limit
  loan('l008', 'u004', 'b042-c1', 3, null),
  loan('l009', 'u004', 'b028-c1', 6, null),
  loan('l010', 'u004', 'b004-c2', 9, null),
  // Signals and Systems: both copies out
  loan('l011', 'u005', 'b014-c1', 7, null),
  loan('l012', 'u006', 'b014-c2', 4, null),
  loan('l013', 'u007', 'b013-c3', 2, null),
  loan('l014', 'u006', 'b006-c1', 8, null),
  // Returned this month
  loan('l015', 'u005', 'b001-c2', 26, 13),
  loan('l016', 'u007', 'b001-c3', 24, 11),
  loan('l017', 'u002', 'b026-c2', 28, 15),
  loan('l018', 'u003', 'b037-c1', 25, 12),
  loan('l019', 'u006', 'b037-c2', 20, 9),
  loan('l020', 'u007', 'b031-c2', 18, 6),
  loan('l021', 'u005', 'b003-c2', 27, 14),
  loan('l022', 'u008', 'b013-c1', 29, 16),
  // Collected just now, due back today, and badly overdue
  loan('l023', 'u006', 'b002-c1', 0, null),
  loan('l024', 'u007', 'b033-c1', 14, null),
  loan('l027', 'u008', 'b020-c3', 50, null),
  // Returned earlier today
  { _id: 'l025', userId: 'u005', bookId: 'b007', copyId: 'b007-c1', issuedAt: fromNow(-13), dueDate: fromNow(1), returnedAt: fromNow(0, -2), renewCount: 0, status: 'returned' },
  { _id: 'l026', userId: 'u002', bookId: 'b031', copyId: 'b031-c3', issuedAt: fromNow(-16), dueDate: fromNow(-2), returnedAt: fromNow(0, -4), renewCount: 0, status: 'returned' },
]
