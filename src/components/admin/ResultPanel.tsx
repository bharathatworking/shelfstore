import {
  CircleAlert,
  CircleCheck,
  SearchX,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { cx } from "../ui/cx"
import { Heading } from "../ui/Heading"
import { Text } from "../ui/Text"

const tones: Record<"success" | "warning" | "neutral", {
  icon: LucideIcon
  box: string
  iconClass: string
}> = {
  success: {
    icon: CircleCheck,
    box: "border-success-line bg-success-bg",
    iconClass: "text-success",
  },
  warning: {
    icon: CircleAlert,
    box: "border-warning-line bg-warning-bg",
    iconClass: "text-warning",
  },
  neutral: {
    icon: SearchX,
    box: "border-line bg-sunken",
    iconClass: "text-ink-subtle",
  },
}

/** Outcome banner for scan lookups: success, expired, not found. */
export function ResultPanel({
  tone,
  title,
  children,
  action,
}: {
  tone: keyof typeof tones
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  const t = tones[tone]
  const Icon = t.icon
  return (
    <div
      role="status"
      className={cx(
        "flex flex-wrap items-start gap-3 rounded-md border p-4",
        t.box,
      )}
    >
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className={cx("mt-0.5 size-5 shrink-0", t.iconClass)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Heading level={3} as="p">
          {title}
        </Heading>
        {children && <Text tone="muted">{children}</Text>}
      </div>
      {action && (
        <div className="w-full shrink-0 self-center sm:w-auto">{action}</div>
      )}
    </div>
  )
}
