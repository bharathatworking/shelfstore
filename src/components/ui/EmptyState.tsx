import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from './cx'
import { Heading } from './Heading'
import { Text } from './Text'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center px-6 py-14 text-center', className)}>
      <Icon aria-hidden strokeWidth={1.5} className="mb-4 size-8 text-ink-subtle" />
      <Heading level={3}>{title}</Heading>
      <Text tone="muted" className="mt-1 max-w-sm">
        {description}
      </Text>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
