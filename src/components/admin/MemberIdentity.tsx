import type { User } from '@/types'
import { Avatar } from '../ui/Avatar'

export function MemberIdentity({
  user,
  size = 'md',
}: {
  user: User
  size?: 'md' | 'lg'
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={user.name} size={size} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-body font-medium text-ink">
          {user.name}
        </span>
        <span className="truncate font-mono text-small text-ink-muted">
          {user.usn ?? user.email}
        </span>
      </div>
    </div>
  )
}
