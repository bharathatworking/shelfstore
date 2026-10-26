import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useCurrentUser } from '@/context/AuthContext'
import { NotificationBell } from './NotificationBell'
import { Avatar } from './ui/Avatar'
import { IconButton } from './ui/IconButton'
import { SearchField } from './ui/SearchField'
import { Wordmark } from './Wordmark'

export function TopBar() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')

  useEffect(() => {
    if (pathname === '/search') setQuery(params.get('q') ?? '')
  }, [pathname, params])

  const submit = (q: string) => {
    const next = new URLSearchParams(pathname === '/search' ? params : undefined)
    if (q) next.set('q', q)
    else next.delete('q')
    navigate(`/search?${next.toString()}`)
  }

  return (
    <header className="sticky top-0 z-40 h-15 border-b border-line bg-surface">
      <div className="mx-auto flex h-full max-w-content items-center gap-4 px-4 md:px-6">
        <Wordmark />
        <div className="hidden flex-1 justify-center md:flex">
          <SearchField value={query} onChange={setQuery} onSubmit={submit} className="max-w-search" />
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <IconButton icon={Search} label="Search" to="/search" className="md:hidden" />
          <NotificationBell />
          <Link to="/profile" aria-label="Your profile" className="ml-1 hidden rounded-md md:inline-flex">
            <Avatar name={user.name} />
          </Link>
        </div>
      </div>
    </header>
  )
}
