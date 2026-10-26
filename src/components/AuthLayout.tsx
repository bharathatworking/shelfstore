import type { ReactNode } from 'react'
import { Wordmark } from './Wordmark'
import { Heading } from './ui/Heading'
import { Text } from './ui/Text'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page px-4">
      <div className="mx-auto flex w-full max-w-form flex-1 flex-col justify-center py-12">
        <div className="mb-10">
          <Wordmark to="/login" />
        </div>
        <Heading level={1}>{title}</Heading>
        <Text tone="muted" className="mt-1.5">
          {subtitle}
        </Text>
        <div className="mt-8">{children}</div>
      </div>
      <Text variant="small" tone="subtle" className="pb-6 text-center">
        Vidyavardhaka College of Engineering library, Mysuru
      </Text>
    </div>
  )
}
