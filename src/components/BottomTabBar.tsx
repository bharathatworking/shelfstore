import { Bookmark, BookOpen, Compass, User } from 'lucide-react'
import { NavLink } from 'react-router'
import { cx } from './ui/cx'

const tabs = [
  { to: '/browse', label: 'Browse', icon: Compass },
  { to: '/my-books', label: 'My books', icon: BookOpen },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
]

export function BottomTabBar() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid h-16 grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cx('flex h-full flex-col items-center justify-center gap-1 text-caption font-medium', isActive ? 'text-primary' : 'text-ink-subtle')
              }
            >
              <Icon aria-hidden strokeWidth={1.5} className="size-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
