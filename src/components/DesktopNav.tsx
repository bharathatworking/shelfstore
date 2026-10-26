import { NavLink } from 'react-router'
import { cx } from './ui/cx'

const links = [
  { to: '/browse', label: 'Browse' },
  { to: '/my-books', label: 'My books' },
  { to: '/saved', label: 'Saved' },
]

/** Secondary nav under the top bar on desktop; mobile uses the bottom tab bar. */
export function DesktopNav() {
  return (
    <nav aria-label="Main" className="hidden border-b border-line bg-surface md:block">
      <ul className="mx-auto flex h-11 max-w-content items-stretch gap-6 px-6">
        {links.map((l) => (
          <li key={l.to} className="flex">
            <NavLink
              to={l.to}
              className={({ isActive }) =>
                cx(
                  '-mb-px flex items-center border-b-2 text-small font-medium transition-colors',
                  isActive ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink',
                )
              }
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
