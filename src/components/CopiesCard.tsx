import type { Copy } from "@/types"
import { copyStatusBadge } from "./statusBadges"
import { Badge } from "./ui/Badge"
import { Card } from "./ui/Card"
import { cx } from "./ui/cx"
import { Heading } from "./ui/Heading"
import { Text } from "./ui/Text"

export function CopiesCard({ copies }: { copies: Copy[] }) {
  const available = copies.filter((c) => c.status === "available").length
  return (
    <Card padding="sm" as="section">
      <div className="flex items-baseline justify-between gap-3">
        <Heading level={3}>Copies</Heading>
        <Text variant="small" tone={available ? "success" : "subtle"} as="span">
          {available} of {copies.length} on the shelf
        </Text>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden>
        {copies.map((c) => (
          <span
            key={c._id}
            className={cx(
              "h-1.5 flex-1 rounded-lg",
              c.status === "available" ? "bg-success" : "bg-line",
            )}
          />
        ))}
      </div>
      <ul className="mt-4 divide-y divide-line">
        {copies.map((c) => {
          const badge = copyStatusBadge[c.status]
          return (
            <li
              key={c._id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="flex flex-col">
                <Text variant="small" mono as="span">
                  {c.barcode}
                </Text>
                <Text variant="small" tone="subtle" as="span">
                  {c.condition[0].toUpperCase() + c.condition.slice(1)}{" "}
                  condition
                </Text>
              </div>
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
