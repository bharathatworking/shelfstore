import { Undo2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { BookIdentity } from "@/components/admin/BookIdentity"
import { DetailList } from "@/components/admin/DetailList"
import { MemberIdentity } from "@/components/admin/MemberIdentity"
import { ResultPanel } from "@/components/admin/ResultPanel"
import { ScanForm } from "@/components/admin/ScanForm"
import { SectionCard } from "@/components/admin/SectionCard"
import { TodaysReturnsTable } from "@/components/admin/TodaysReturnsTable"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Heading } from "@/components/ui/Heading"
import { OptionGroup } from "@/components/ui/OptionGroup"
import { Text } from "@/components/ui/Text"
import { Textarea } from "@/components/ui/Textarea"
import { useAdminRefresh } from "@/context/AdminRefreshContext"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { formatDate, rupees } from "@/lib/format"
import {
  findLoanByBarcode,
  getTodaysReturns,
  returnLoan,
  type ReturnCondition,
  type ReturnMatch,
} from "@/services/api"

const conditions: Array<{
  value: ReturnCondition
  label: string
  description: string
}> = [
  { value: "good", label: "Good", description: "Back on the shelf" },
  { value: "fair", label: "Fair", description: "Light wear" },
  { value: "poor", label: "Poor", description: "Heavy wear" },
  { value: "damaged", label: "Damaged", description: "Pull for repair" },
]

function ReturnForm({
  match,
  onDone,
}: {
  match: ReturnMatch
  onDone: (summary: string) => void
}) {
  const toast = useToast()
  const [condition, setCondition] = useState<ReturnCondition>(
    match.copy.condition,
  )
  const [fineAction, setFineAction] = useState<"collected" | "waived" | null>(
    null,
  )
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { loan, user, book, copy, daysOverdue, fine, finePerDay } = match

  const submit = async () => {
    if (fine > 0 && !fineAction)
      return setError("Choose whether the fine was collected or waived.")
    if (fineAction === "waived" && !reason.trim())
      return setError("Add a reason for waiving the fine.")
    setBusy(true)
    try {
      await returnLoan(loan._id, {
        condition,
        fineAction: fineAction ?? undefined,
        waiveReason: reason,
      })
      const fineNote = fine > 0 ? ` ${rupees(fine)} fine ${fineAction}.` : ""
      onDone(
        `${book.title} (${copy.barcode}) checked in from ${user.name}.${fineNote}`,
      )
    } catch (err) {
      toast("danger", "Could not check in", (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-md border border-line p-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MemberIdentity user={user} size="lg" />
        <BookIdentity
          book={book}
          code={copy.barcode}
          extra={book.shelfLocation}
          size="md"
        />
      </div>
      <div className="border-t border-line pt-5">
        <DetailList
          items={[
            { label: "Issued", value: formatDate(loan.issuedAt) },
            { label: "Due", value: formatDate(loan.dueDate) },
            {
              label: "Overdue",
              value:
                daysOverdue > 0
                  ? `${daysOverdue} ${daysOverdue === 1 ? "day" : "days"}`
                  : "On time",
              tone: daysOverdue > 0 ? "danger" : "default",
            },
          ]}
        />
      </div>

      {fine > 0 && (
        <div className="flex flex-col gap-4 rounded-md border border-danger-line bg-danger-bg p-4">
          <div className="flex items-baseline justify-between">
            <Heading level={3} as="p">
              Late fine
            </Heading>
            <span className="font-serif text-h2 font-semibold tabular-nums text-danger">
              {rupees(fine)}
            </span>
          </div>
          <Text variant="small" tone="muted">
            {daysOverdue} days × {rupees(finePerDay)} per day
          </Text>
          <OptionGroup
            label="Fine"
            value={fineAction}
            onChange={(v) => {
              setFineAction(v)
              setError(null)
            }}
            options={[
              {
                value: "collected",
                label: "Collected",
                description: "Paid at the desk",
              },
              {
                value: "waived",
                label: "Waive",
                description: "Needs a reason",
              },
            ]}
          />
          {fineAction === "waived" && (
            <Textarea
              label="Reason for waiving"
              value={reason}
              autoFocus
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
              placeholder="e.g. Student was hospitalised during the due week"
            />
          )}
        </div>
      )}

      <OptionGroup
        label="Condition on return"
        value={condition}
        onChange={setCondition}
        options={conditions}
      />

      {error && (
        <Text variant="small" tone="danger">
          {error}
        </Text>
      )}
      <div className="flex justify-end">
        <Button
          icon={Undo2}
          onClick={submit}
          loading={busy}
          className="w-full sm:w-auto"
        >
          Check in
        </Button>
      </div>
    </div>
  )
}

export function ReturnPage() {
  const [params] = useSearchParams()
  const { version, bump } = useAdminRefresh()
  const [code, setCode] = useState<string | null>(null)
  const [match, setMatch] = useState<ReturnMatch | null | undefined>(undefined)
  const [searching, setSearching] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [scanKey, setScanKey] = useState(0)
  const today = useAsync(getTodaysReturns, [version])

  const search = async (value: string) => {
    setCode(value)
    setDone(null)
    setSearching(true)
    try {
      setMatch(await findLoanByBarcode(value))
    } finally {
      setSearching(false)
    }
  }

  const initialBarcode = params.get("barcode")
  useEffect(() => {
    if (initialBarcode) search(initialBarcode)
  }, [initialBarcode])

  const finish = (summary: string) => {
    setDone(summary)
    setMatch(undefined)
    setCode(null)
    setScanKey((k) => k + 1)
    bump()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-workflow">
        <Card>
          <div className="flex flex-col gap-5">
            <ScanForm
              key={scanKey}
              label="Copy barcode"
              hint="Scan the barcode on the back cover."
              placeholder="e.g. B001-C1"
              initial={scanKey === 0 ? (initialBarcode ?? "") : ""}
              loading={searching}
              onSubmit={search}
            />
            {done && (
              <ResultPanel tone="success" title="Checked in">
                {done}
              </ResultPanel>
            )}
            {match && (
              <ReturnForm key={match.loan._id} match={match} onDone={finish} />
            )}
            {match === null && (
              <ResultPanel tone="neutral" title={`No active loan for ${code}`}>
                This copy isn't checked out. It may already be back on the
                shelf.
              </ResultPanel>
            )}
          </div>
        </Card>
      </div>
      <SectionCard title="Returned today">
        <TodaysReturnsTable
          rows={today.data}
          error={today.error}
          onRetry={today.reload}
        />
      </SectionCard>
    </div>
  )
}
