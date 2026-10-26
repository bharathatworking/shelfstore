import { HandCoins } from "lucide-react"
import { useState } from "react"
import { BookIdentity } from "@/components/admin/BookIdentity"
import { MemberIdentity } from "@/components/admin/MemberIdentity"
import { Badge } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { EmptyState } from "@/components/ui/EmptyState"
import { Modal } from "@/components/ui/Modal"
import { Select } from "@/components/ui/Select"
import { Text } from "@/components/ui/Text"
import { Textarea } from "@/components/ui/Textarea"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { formatDate, rupees } from "@/lib/format"
import { listFines, settleFine, type FineItem } from "@/services/api"

type Range = "30" | "90" | "all"

export function FinesPage() {
  const toast = useToast()
  const [range, setRange] = useState<Range>("90")
  const fines = useAsync(
    () => listFines(range === "all" ? undefined : Number(range)),
    [range],
  )
  const [waiving, setWaiving] = useState<FineItem | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const data = fines.data

  const settle = async (fine: FineItem, action: "collected" | "waived") => {
    setBusy(true)
    try {
      await settleFine(fine.loan._id, action, reason)
      toast(
        "success",
        action === "collected" ? "Fine collected" : "Fine waived",
        `${rupees(fine.amount)} for ${fine.user.name}.`,
      )
      setWaiving(null)
      setReason("")
      fines.reload()
    } catch (error) {
      toast("danger", "Could not update fine", (error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card padding="none">
        <dl className="grid grid-cols-2 divide-x divide-y divide-line md:grid-cols-4 md:divide-y-0">
          {[
            {
              label: "Outstanding",
              value: rupees(data?.outstanding ?? 0),
              danger: true,
            },
            { label: "Students", value: data?.students ?? 0 },
            { label: "Collected", value: rupees(data?.collected ?? 0) },
            { label: "Waived", value: rupees(data?.waived ?? 0) },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1 p-4 md:p-5">
              <Text as="dt" variant="small" tone="muted">
                {item.label}
              </Text>
              <Text
                as="dd"
                className="text-h2 font-semibold tabular-nums"
                tone={item.danger && data?.outstanding ? "danger" : "default"}
              >
                {item.value}
              </Text>
            </div>
          ))}
        </dl>
      </Card>

      <div className="flex justify-end">
        <Select
          label="Date range"
          hideLabel
          value={range}
          onChange={setRange}
          className="w-full sm:w-52"
          options={[
            { value: "30", label: "Last 30 days" },
            { value: "90", label: "Last 90 days" },
            { value: "all", label: "All time" },
          ]}
        />
      </div>

      <Card padding="none">
        {fines.error ? (
          <AsyncError error={fines.error} onRetry={fines.reload} />
        ) : data?.rows.length ? (
          <DataTable
            label="Fine ledger"
            rows={data.rows}
            rowKey={(fine) => fine._id}
            actionColumnClassName="w-40"
            mobileTitle={(fine) => <MemberIdentity user={fine.user} />}
            mobileFields={[{ key: "book" }, { key: "amount" }, { key: "date" }]}
            mobileStatus={(fine) => (
              <Badge
                tone={fine.status === "outstanding" ? "danger" : "neutral"}
              >
                {fine.status}
              </Badge>
            )}
            columns={[
              {
                key: "member",
                header: "Member",
                render: (fine) => <MemberIdentity user={fine.user} />,
              },
              {
                key: "book",
                header: "Book",
                render: (fine) => <BookIdentity book={fine.book} />,
              },
              {
                key: "amount",
                header: "Amount",
                className: "w-24",
                render: (fine) => (
                  <Text
                    weight="medium"
                    tone={fine.status === "outstanding" ? "danger" : "default"}
                  >
                    {rupees(fine.amount)}
                  </Text>
                ),
              },
              {
                key: "date",
                header: "Date",
                className: "w-28 whitespace-nowrap",
                render: (fine) => formatDate(fine.date),
              },
              {
                key: "status",
                header: "Status",
                className: "w-28",
                render: (fine) => (
                  <Badge
                    tone={fine.status === "outstanding" ? "danger" : "neutral"}
                  >
                    {fine.status}
                  </Badge>
                ),
              },
            ]}
            actions={(fine) =>
              fine.status === "outstanding" ? (
                <>
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => settle(fine, "collected")}
                  >
                    Collect
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setWaiving(fine)
                      setReason("")
                    }}
                  >
                    Waive
                  </Button>
                </>
              ) : null
            }
          />
        ) : fines.loading ? (
          <div className="p-8 text-center text-ink-muted">Loading fines…</div>
        ) : (
          <EmptyState
            icon={HandCoins}
            title="No fines in this range"
            description="Outstanding and settled fines will appear here."
          />
        )}
      </Card>

      <Modal
        open={Boolean(waiving)}
        onClose={() => setWaiving(null)}
        title="Waive fine"
        fullScreenOnMobile
        footer={
          <>
            <Button variant="secondary" onClick={() => setWaiving(null)}>
              Cancel
            </Button>
            <Button
              disabled={!reason.trim()}
              loading={busy}
              onClick={() => waiving && settle(waiving, "waived")}
            >
              Waive fine
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="A reason is required"
        />
      </Modal>
    </div>
  )
}
