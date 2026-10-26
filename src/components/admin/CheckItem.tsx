import { Check, X } from "lucide-react"
import { cx } from "../ui/cx"

export function CheckItem({
  ok,
  label,
  detail,
}: {
  ok: boolean
  label: string
  detail: string
}) {
  const Icon = ok ? Check : X
  return (
    <li className="flex items-start gap-3">
      <span
        className={cx(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-lg",
          ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
        )}
      >
        <Icon aria-hidden strokeWidth={2} className="size-3.5" />
      </span>
      <div className="flex flex-col">
        <span className="text-body text-ink">
          {label}
          <span className="sr-only">{ok ? " (passed)" : " (failed)"}</span>
        </span>
        <span
          className={cx(
            "text-small tabular-nums",
            ok ? "text-ink-muted" : "text-danger",
          )}
        >
          {detail}
        </span>
      </div>
    </li>
  )
}
