import { useEffect, useState } from "react"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"
import { OptionGroup } from "../ui/OptionGroup"
import { Text } from "../ui/Text"
import { Textarea } from "../ui/Textarea"

const REASONS = [
  "Fine unpaid",
  "Borrow limit reached",
  "Reference-only title",
  "Copy unavailable",
  "Other",
] as const
type Reason = typeof REASONS[number]

interface RejectModalProps {
  open: boolean
  subject: string
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

export function RejectModal({
  open,
  subject,
  onClose,
  onConfirm,
}: RejectModalProps) {
  const [reason, setReason] = useState<Reason | null>(null)
  const [other, setOther] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setReason(null)
      setOther("")
      setError(null)
    }
  }, [open])

  const submit = async () => {
    if (!reason) return setError("Choose a reason")
    if (reason === "Other" && !other.trim())
      return setError("Describe the reason")
    setBusy(true)
    try {
      await onConfirm(reason === "Other" ? other.trim() : reason)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject request"
      fullScreenOnMobile
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            Reject request
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Text tone="muted">{subject}. The student will see this reason.</Text>
        <OptionGroup
          label="Reason"
          layout="stack"
          value={reason}
          onChange={(r) => {
            setReason(r)
            setError(null)
          }}
          options={REASONS.map((r) => ({ value: r, label: r }))}
        />
        {reason === "Other" && (
          <Textarea
            label="Describe the reason"
            value={other}
            autoFocus
            onChange={(e) => setOther(e.target.value)}
          />
        )}
        {error && (
          <Text variant="small" tone="danger">
            {error}
          </Text>
        )}
      </div>
    </Modal>
  )
}
