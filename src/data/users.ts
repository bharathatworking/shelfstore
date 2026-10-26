import type { User } from '@/types'
import { fromNow } from './time'

export const users: User[] = [
  { _id: 'u001', name: 'Keshav Raj', email: 'keshav@vvce.ac.in', usn: '4VV23CS041', role: 'student', status: 'active', joinedAt: fromNow(-410) },
  { _id: 'u002', name: 'Ananya Shetty', email: 'ananya@vvce.ac.in', usn: '4VV23EC012', role: 'student', status: 'active', joinedAt: fromNow(-395) },
  { _id: 'u003', name: 'Rohan Pillai', email: 'rohan@vvce.ac.in', usn: '4VV22ME027', role: 'student', status: 'active', joinedAt: fromNow(-720) },
  { _id: 'u004', name: 'Divya Nair', email: 'divya@vvce.ac.in', usn: '4VV23CS018', role: 'student', status: 'active', joinedAt: fromNow(-402) },
  { _id: 'u005', name: 'Arjun Menon', email: 'arjun@vvce.ac.in', usn: '4VV22EC033', role: 'student', status: 'active', joinedAt: fromNow(-700) },
  { _id: 'u006', name: 'Sneha Kulkarni', email: 'sneha@vvce.ac.in', usn: '4VV24CS005', role: 'student', status: 'active', joinedAt: fromNow(-60) },
  { _id: 'u007', name: 'Meera Iyer', email: 'meera@vvce.ac.in', usn: '4VV23IS021', role: 'student', status: 'active', joinedAt: fromNow(-380) },
  { _id: 'u008', name: 'Karthik Hegde', email: 'karthik@vvce.ac.in', usn: '4VV22CV009', role: 'student', status: 'suspended', joinedAt: fromNow(-690) },
  { _id: 'u100', name: 'Mrs. Lakshmi Prasad', email: 'admin@shelfstore.in', usn: null, role: 'admin', status: 'active', joinedAt: fromNow(-1500) },
]
