import type { ReactNode } from "react"
import { cx } from "./cx"

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral"

const tones: Record<BadgeTone, string> = {
  success: "bg-success-bg border-success-line text-success",
  warning: "bg-warning-bg border-warning-line text-warning",
  danger: "bg-danger-bg border-danger-line text-danger",
  info: "bg-info-bg border-info-line text-info",
  neutral: "bg-neutral-bg border-neutral-line text-neutral",
}

export function Badge({
  tone,
  children,
  className,
}: {
  tone: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        "inline-flex h-5.5 shrink-0 items-center whitespace-nowrap rounded-lg border px-2.5 text-small font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
