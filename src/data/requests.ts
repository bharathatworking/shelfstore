import type { BookRequest } from '@/types'
import { fromNow } from './time'

export const requests: BookRequest[] = [
  // Keshav: approved hold, waiting for collection
  { _id: 'r001', userId: 'u001', bookId: 'b003', copyId: 'b003-c1', status: 'approved', requestedAt: fromNow(0, -18), decidedAt: fromNow(0, -18), holdExpiresAt: fromNow(0, 30), flagReason: null, rejectReason: null },
  // Keshav: waitlisted, no copies available
  { _id: 'r002', userId: 'u001', bookId: 'b014', copyId: null, status: 'pending', requestedAt: fromNow(-1, -3), decidedAt: null, holdExpiresAt: null, flagReason: 'No copies are available right now. You are on the waitlist.', rejectReason: null },
  // Divya: flagged for the book limit
  { _id: 'r003', userId: 'u004', bookId: 'b006', copyId: null, status: 'pending', requestedAt: fromNow(0, -5), decidedAt: null, holdExpiresAt: null, flagReason: 'You already have 3 of 3 books out or on hold.', rejectReason: null },
  // History
  { _id: 'r004', userId: 'u001', bookId: 'b031', copyId: 'b031-c1', status: 'fulfilled', requestedAt: fromNow(-23), decidedAt: fromNow(-23), holdExpiresAt: fromNow(-21), flagReason: null, rejectReason: null },
  { _id: 'r005', userId: 'u001', bookId: 'b008', copyId: null, status: 'rejected', requestedAt: fromNow(-35), decidedAt: fromNow(-34), holdExpiresAt: null, flagReason: 'Outstanding fines of ₹110 are above the ₹100 limit.', rejectReason: 'Please clear your fines at the desk first.' },
  { _id: 'r006', userId: 'u001', bookId: 'b020', copyId: 'b020-c2', status: 'expired', requestedAt: fromNow(-50), decidedAt: fromNow(-50), holdExpiresAt: fromNow(-48), flagReason: null, rejectReason: null },
  { _id: 'r007', userId: 'u007', bookId: 'b029', copyId: null, status: 'rejected', requestedAt: fromNow(-12), decidedAt: fromNow(-11), holdExpiresAt: null, flagReason: null, rejectReason: 'Reference copy for staff use this term.' },
  // Rohan: flagged for fines, a copy is free
  { _id: 'r008', userId: 'u003', bookId: 'b021', copyId: null, status: 'pending', requestedAt: fromNow(0, -2), decidedAt: null, holdExpiresAt: null, flagReason: 'Outstanding fines are above the ₹100 limit.', rejectReason: null },
]
