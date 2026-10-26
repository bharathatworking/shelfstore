interface BarChartProps {
  data: Array<{ label: string; value: number }>
  label: string
}

/** Minimal vertical bar chart: primary bars, values on top, labels underneath. No legend. */
export function BarChart({ data, label }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <figure aria-label={label} className="flex h-44 items-end gap-3">
      {data.map((d) => (
        <div
          key={d.label}
          className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
        >
          <span className="text-small tabular-nums text-ink-muted">
            {d.value}
          </span>
          <div className="flex w-full max-w-9 flex-1 items-end">
            <div
              className="w-full rounded-t-sm bg-primary"
              // Bar height is data-driven.
              style={{
                height: `${Math.max(d.value ? 4 : 1, (d.value / max) * 100)}%`,
              }}
            />
          </div>
          <span className="text-caption uppercase tracking-wider text-ink-subtle">
            {d.label}
          </span>
        </div>
      ))}
    </figure>
  )
}
