import type { ReactNode } from 'react'
import { Card } from '../ui/Card'
import { Heading } from '../ui/Heading'

/** Card with a titled header row and flush body, used across librarian screens. */
export function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card padding="none" as="section">
      <div className="flex h-14 items-center justify-between gap-3 border-b border-line px-5">
        <Heading level={3}>{title}</Heading>
        {action}
      </div>
      {children}
    </Card>
  )
}
