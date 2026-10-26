import {
  BookOpen,
  BookOpenCheck,
  HandCoins,
  History,
  PauseCircle,
} from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router"
import { BookIdentity } from "@/components/admin/BookIdentity"
import { Badge } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { EmptyState } from "@/components/ui/EmptyState"
import { Heading } from "@/components/ui/Heading"
import { Modal } from "@/components/ui/Modal"
import { StatCard } from "@/components/ui/StatCard"
import { Tabs } from "@/components/ui/Tabs"
import { Text } from "@/components/ui/Text"
import { Textarea } from "@/components/ui/Textarea"
import { Avatar } from "@/components/ui/Avatar"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { dueLabel, formatDate, rupees } from "@/lib/format"
import {
  forceReturnLoan,
  getAdminMember,
  setMemberStatus,
  settleFine,
  type FineItem,
} from "@/services/api"

type DetailTab = "active" | "history" | "fines"

export function MemberDetailPage() {
  const { memberId = "" } = useParams()
  const toast = useToast()
  const member = useAsync(() => getAdminMember(memberId), [memberId])
  const [tab, setTab] = useState<DetailTab>("active")
  const [statusOpen, setStatusOpen] = useState(false)
  const [waiving, setWaiving] = useState<FineItem | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const data = member.data

  const toggleStatus = async () => {
    if (!data) return
    setBusy(true)
    try {
      const next = data.user.status === "active" ? "suspended" : "active"
      await setMemberStatus(data.user._id, next)
      toast(
        "success",
        next === "active" ? "Member reactivated" : "Member suspended",
        data.user.name,
      )
      setStatusOpen(false)
      member.reload()
    } finally {
      setBusy(false)
    }
  }

  const forceReturn = async (loanId: string) => {
    setBusy(true)
    try {
      await forceReturnLoan(loanId)
      toast("success", "Book returned", "The copy is back on the shelf.")
      member.reload()
    } catch (error) {
      toast("danger", "Could not return book", (error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const waive = async () => {
    if (!waiving || !reason.trim()) return
    setBusy(true)
    try {
      await settleFine(waiving.loan._id, "waived", reason)
      toast("success", "Fine waived", `${rupees(waiving.amount)} was waived.`)
      setWaiving(null)
      setReason("")
      member.reload()
    } catch (error) {
      toast("danger", "Could not waive fine", (error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (member.error)
    return (
      <Card padding="none">
        <AsyncError error={member.error} onRetry={member.reload} />
      </Card>
    )

  if (!data)
    return (
      <Card>
        <Text tone="muted">Loading member details…</Text>
      </Card>
    )

  const active = (
    <DataTable
      label="Active loans"
      rows={data.active}
      rowKey={(loan) => loan._id}
      actionColumnClassName="w-32"
      mobileTitle={(loan) => <BookIdentity book={loan.book} />}
      mobileFields={[{ key: "copy" }, { key: "due" }, { key: "renewals" }]}
      mobileStatus={(loan) => (
        <Badge tone={loan.daysOverdue ? "danger" : "neutral"}>
          {loan.daysOverdue ? "Overdue" : "Borrowed"}
        </Badge>
      )}
      columns={[
        {
          key: "book",
          header: "Book",
          render: (loan) => <BookIdentity book={loan.book} />,
        },
        {
          key: "copy",
          header: "Copy",
          render: (loan) => (
            <Text mono variant="small">
              {loan.copyId}
            </Text>
          ),
        },
        {
          key: "due",
          header: "Due",
          render: (loan) => (
            <div>
              <Text>{formatDate(loan.dueDate)}</Text>
              <Text
                variant="small"
                tone={loan.daysOverdue ? "danger" : "muted"}
              >
                {dueLabel(loan.dueDate)}
              </Text>
            </div>
          ),
        },
        {
          key: "renewals",
          header: "Renewals",
          render: (loan) => loan.renewCount,
        },
      ]}
      actions={(loan) => (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => forceReturn(loan._id)}
        >
          Force return
        </Button>
      )}
    />
  )

  const history = (
    <DataTable
      label="Loan history"
      rows={data.history}
      rowKey={(loan) => loan._id}
      mobileTitle={(loan) => <BookIdentity book={loan.book} />}
      mobileFields={[{ key: "issued" }, { key: "returned" }]}
      mobileStatus={() => <Badge tone="success">Returned</Badge>}
      columns={[
        {
          key: "book",
          header: "Book",
          render: (loan) => <BookIdentity book={loan.book} />,
        },
        {
          key: "issued",
          header: "Issued",
          render: (loan) => formatDate(loan.issuedAt),
        },
        {
          key: "returned",
          header: "Returned",
          render: (loan) =>
            loan.returnedAt ? formatDate(loan.returnedAt) : "—",
        },
      ]}
    />
  )

  const fines = (
    <DataTable
      label="Member fines"
      rows={data.fines}
      rowKey={(fine) => fine._id}
      mobileTitle={(fine) => <BookIdentity book={fine.book} />}
      mobileFields={[{ key: "amount" }, { key: "date" }]}
      mobileStatus={(fine) => (
        <Badge tone={fine.status === "outstanding" ? "danger" : "neutral"}>
          {fine.status}
        </Badge>
      )}
      columns={[
        {
          key: "book",
          header: "Book",
          render: (fine) => <BookIdentity book={fine.book} />,
        },
        {
          key: "amount",
          header: "Amount",
          render: (fine) => rupees(fine.amount),
        },
        {
          key: "date",
          header: "Date",
          render: (fine) => formatDate(fine.date),
        },
        {
          key: "status",
          header: "Status",
          render: (fine) => (
            <Badge tone={fine.status === "outstanding" ? "danger" : "neutral"}>
              {fine.status}
            </Badge>
          ),
        },
      ]}
      actions={(fine) =>
        fine.status === "outstanding" ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setWaiving(fine)
              setReason("")
            }}
          >
            Waive
          </Button>
        ) : null
      }
    />
  )

  const rows =
    tab === "active"
      ? data.active
      : tab === "history"
        ? data.history
        : data.fines

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={data.user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <Heading level={2}>{data.user.name}</Heading>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <Text mono variant="small" tone="muted">
              {data.user.usn}
            </Text>
            <Text variant="small" tone="muted">
              {data.user.email}
            </Text>
            <Text variant="small" tone="subtle">
              Member since {formatDate(data.user.joinedAt)}
            </Text>
          </div>
        </div>
        <Badge tone={data.user.status === "active" ? "success" : "danger"}>
          {data.user.status === "active" ? "Active" : "Suspended"}
        </Badge>
        <Button variant="secondary" onClick={() => setStatusOpen(true)}>
          {data.user.status === "active" ? "Suspend" : "Reactivate"}
        </Button>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Books out" value={data.stats.active} icon={BookOpen} />
        <StatCard label="On hold" value={data.stats.holds} icon={PauseCircle} />
        <StatCard
          label="All-time loans"
          value={data.stats.totalBorrowed}
          icon={BookOpenCheck}
        />
        <StatCard
          label="Fines due"
          value={rupees(data.stats.fines)}
          icon={HandCoins}
          tone={data.stats.fines ? "danger" : "default"}
        />
      </div>

      <Tabs
        label="Member records"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "active", label: "Active loans", count: data.active.length },
          { id: "history", label: "History", count: data.history.length },
          { id: "fines", label: "Fines", count: data.fines.length },
        ]}
      />
      <Card padding="none">
        {rows.length ? (
          tab === "active" ? (
            active
          ) : tab === "history" ? (
            history
          ) : (
            fines
          )
        ) : (
          <EmptyState
            icon={tab === "fines" ? HandCoins : History}
            title={`No ${tab === "active" ? "active loans" : tab}`}
            description="Records will appear here when there is activity."
          />
        )}
      </Card>

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title={
          data.user.status === "active"
            ? "Suspend this member?"
            : "Reactivate this member?"
        }
        fullScreenOnMobile
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={toggleStatus}>
              Confirm
            </Button>
          </>
        }
      >
        <Text tone="muted">
          {data.user.status === "active"
            ? "Suspended members cannot request or borrow books."
            : "This member will be able to request and borrow books again."}
        </Text>
      </Modal>

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
            <Button disabled={!reason.trim()} loading={busy} onClick={waive}>
              Waive fine
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why this fine is being waived"
        />
      </Modal>
    </div>
  )
}
