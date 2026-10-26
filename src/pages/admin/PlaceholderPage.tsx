import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export function PlaceholderPage({
  icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Card padding="none">
      <EmptyState icon={icon} title={title} description={description} />
    </Card>
  )
}
