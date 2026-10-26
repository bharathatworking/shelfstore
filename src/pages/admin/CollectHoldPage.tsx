import { PackageCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { BookIdentity } from "@/components/admin/BookIdentity"
import { DetailList } from "@/components/admin/DetailList"
import { ListSkeleton } from "@/components/admin/ListSkeleton"
import { MemberIdentity } from "@/components/admin/MemberIdentity"
import { ResultPanel } from "@/components/admin/ResultPanel"
import { ScanForm } from "@/components/admin/ScanForm"
import { SectionCard } from "@/components/admin/SectionCard"
import { Button } from "@/components/ui/Button"
import { AsyncError } from "@/components/ui/AsyncError"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { useAdminRefresh } from "@/context/AdminRefreshContext"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { firstName, formatDate, formatDayTime } from "@/lib/format"
import {
  collectHold,
  dueDateIfIssuedNow,
  findHold,
  listRequests,
  type HoldLookup,
  type HoldMatch,
} from "@/services/api"
import type { Loan } from "@/types"

function HoldDetails({
  hold,
  onIssue,
  busy,
}: {
  hold: HoldMatch
  onIssue: () => void
  busy: boolean
}) {
  return (
    <div className="flex flex-col gap-5 rounded-md border border-line p-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MemberIdentity user={hold.user} size="lg" />
        <BookIdentity
          book={hold.book}
          code={hold.copy.barcode}
          extra={hold.book.shelfLocation}
          size="md"
        />
      </div>
      <div className="flex flex-col gap-5 border-t border-line pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <DetailList
          items={[
            {
              label: "Hold expires",
              value: formatDayTime(hold.request.holdExpiresAt!),
            },
            {
              label: "Due back if issued now",
              value: formatDate(dueDateIfIssuedNow()),
            },
          ]}
        />
        <Button icon={PackageCheck} onClick={onIssue} loading={busy}>
          Issue to {firstName(hold.user.name)}
        </Button>
      </div>
    </div>
  )
}

export function CollectHoldPage() {
  const [params] = useSearchParams()
  const toast = useToast()
  const { version, bump } = useAdminRefresh()
  const [code, setCode] = useState<string | null>(null)
  const [lookup, setLookup] = useState<HoldLookup | null>(null)
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [issued, setIssued] = useState<{ loan: Loan; hold: HoldMatch } | null>(
    null,
  )
  const [scanKey, setScanKey] = useState(0)
  const waiting = useAsync(() => listRequests("approved"), [version])

  const search = async (value: string) => {
    setCode(value)
    setIssued(null)
    setSearching(true)
    try {
      setLookup(await findHold(value))
    } finally {
      setSearching(false)
    }
  }

  const initialCode = params.get("code")
  useEffect(() => {
    if (initialCode) search(initialCode)
  }, [initialCode])

  const issue = async (hold: HoldMatch) => {
    setBusy(true)
    try {
      const loan = await collectHold(hold.request._id)
      setIssued({ loan, hold })
      setLookup(null)
      bump()
      toast("success", "Book issued", `${hold.book.title} to ${hold.user.name}`)
    } catch (err) {
      toast("danger", "Could not issue", (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const next = () => {
    setIssued(null)
    setLookup(null)
    setCode(null)
    setScanKey((k) => k + 1)
  }

  const pick = (barcode: string) => {
    setScanKey((k) => k + 1)
    search(barcode)
  }

  return (
    <div className="mx-auto flex w-full max-w-workflow flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-5">
          <ScanForm
            key={scanKey}
            label="Copy barcode or student USN"
            hint="Scan the book's barcode or the student's ID card."
            placeholder="e.g. B014-C2 or 1RV22CS045"
            initial={code ?? initialCode ?? ""}
            loading={searching}
            onSubmit={search}
          />

          {issued && (
            <ResultPanel
              tone="success"
              title={`Issued to ${issued.hold.user.name}`}
              action={
                <Button variant="secondary" onClick={next}>
                  Next student
                </Button>
              }
            >
              {issued.hold.book.title} ({issued.hold.copy.barcode}) is due back{" "}
              {formatDate(issued.loan.dueDate)}.
            </ResultPanel>
          )}

          {lookup?.kind === "found" && (
            <div className="flex flex-col gap-3">
              {lookup.holds.map((h) => (
                <HoldDetails
                  key={h.request._id}
                  hold={h}
                  busy={busy}
                  onIssue={() => issue(h)}
                />
              ))}
            </div>
          )}

          {lookup?.kind === "expired" && (
            <ResultPanel
              tone="warning"
              title={`Hold expired ${formatDayTime(lookup.hold.request.holdExpiresAt!)}`}
              action={
                <Button
                  variant="secondary"
                  to={`/admin/issue?member=${lookup.hold.user._id}&book=${lookup.hold.book._id}`}
                >
                  Issue directly
                </Button>
              }
            >
              {lookup.hold.user.name}'s hold on {lookup.hold.book.title} lapsed
              and the copy went back on the shelf. You can still issue a free
              copy directly.
            </ResultPanel>
          )}

          {lookup?.kind === "not_found" && (
            <ResultPanel
              tone="neutral"
              title={`No hold found for ${code}`}
              action={
                lookup.user ? (
                  <Button
                    variant="secondary"
                    to={`/admin/issue?member=${lookup.user._id}`}
                  >
                    Direct issue to {firstName(lookup.user.name)}
                  </Button>
                ) : undefined
              }
            >
              {lookup.user
                ? `${lookup.user.name} has no book waiting at the desk.`
                : "Check the code and try again. Student USNs look like 1RV22CS045, barcodes like B014-C2."}
            </ResultPanel>
          )}
        </div>
      </Card>

      <SectionCard title="Waiting for collection">
        {waiting.error ? (
          <AsyncError error={waiting.error} onRetry={waiting.reload} />
        ) : !waiting.data ? (
          <ListSkeleton rows={2} />
        ) : waiting.data.length ? (
          <ul className="divide-y divide-line">
            {waiting.data.map((v) => (
              <li key={v.request._id}>
                <button
                  type="button"
                  onClick={() => v.copy && pick(v.copy.barcode)}
                  className="flex w-full flex-col items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-hover md:flex-row md:items-center md:gap-6"
                >
                  <div className="w-full shrink-0 md:w-48">
                    <MemberIdentity user={v.user} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <BookIdentity book={v.book} code={v.copy?.barcode} />
                  </div>
                  <span className="shrink-0 text-small tabular-nums text-ink-muted">
                    Until {formatDayTime(v.request.holdExpiresAt!)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={PackageCheck}
            title="No holds waiting"
            description="Approved requests appear here until the student picks the book up."
          />
        )}
      </SectionCard>
    </div>
  )
}
