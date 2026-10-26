import type { BadgeTone } from "./ui/Badge"
import type { CopyStatus } from "@/types"

export const copyStatusBadge: Record<CopyStatus, {
  tone: BadgeTone
  label: string
}> = {
  available: { tone: "success", label: "Available" },
  on_hold: { tone: "info", label: "On hold" },
  borrowed: { tone: "neutral", label: "Borrowed" },
  damaged: { tone: "warning", label: "Damaged" },
  lost: { tone: "danger", label: "Lost" },
  retired: { tone: "neutral", label: "Retired" },
}
