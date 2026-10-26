import {
  Archive,
  CircleAlert,
  MoreHorizontal,
  Plus,
  TriangleAlert,
} from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router"
import { BookIdentity } from "@/components/admin/BookIdentity"
import { ListSkeleton } from "@/components/admin/ListSkeleton"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { EmptyState } from "@/components/ui/EmptyState"
import { Menu } from "@/components/ui/Menu"
import { Modal } from "@/components/ui/Modal"
import { Select } from "@/components/ui/Select"
import { Text } from "@/components/ui/Text"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { formatDate } from "@/lib/format"
import {
  addAdminCopy,
  getAdminBook,
  listAdminCopies,
  updateAdminCopy,
  type AdminCopyView,
} from "@/services/api"
import type { CopyStatus } from "@/types"

const statusDetails: Record<CopyStatus, { label: string tone: BadgeTone }> = {
  available: { label: "Available", tone: "success" },
  on_hold: { label: "On hold", tone: "info" },
  borrowed: { label: "Borrowed", tone: "neutral" },
  damaged: { label: "Damaged", tone: "warning" },
  lost: { label: "Lost", tone: "danger" },
  retired: { label: "Retired", tone: "neutral" },
}

export function CopiesPage() {
  const { bookId = "" } = useParams()
  const toast = useToast()
  const [version, setVersion] = useState(0)
  const [adding, setAdding] = useState(false)
  const [retiring, setRetiring] = useState<AdminCopyView | null>(null)
  const book = useAsync(() => getAdminBook(bookId), [bookId, version])
  const list = useAsync(() => listAdminCopies(bookId), [bookId, version])

  const refresh = () => setVersion((value) => value + 1)
  const change = async (
    row: AdminCopyView,
    patch: Parameters<typeof updateAdminCopy>[1],
    success: string,
  ) => {
    try {
      await updateAdminCopy(row.copy._id, patch)
      refresh()
      toast("success", success, `${row.copy.barcode} was updated.`)
    } catch (error) {
      toast("danger", "Could not update copy", (error as Error).message)
    }
  }

  const add = async () => {
    setAdding(true)
    try {
      const copy = await addAdminCopy(bookId)
      refresh()
      toast("success", "Copy added", `${copy.barcode} is ready for labeling.`)
    } catch (error) {
      toast("danger", "Could not add copy", (error as Error).message)
    } finally {
      setAdding(false)
    }
  }

  const retire = async () => {
    if (!retiring) return
    await change(retiring, { status: "retired" }, "Copy retired")
    setRetiring(null)
  }

  const statusBadge = (status: CopyStatus) => {
    const detail = statusDetails[status]
    return <Badge tone={detail.tone}>{detail.label}</Badge>
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {book.data ? (
          <>
            <div className="min-w-0 flex-1">
              <BookIdentity
                book={book.data}
                code={book.data.shelfLocation}
                extra={book.data.isbn}
                size="md"
              />
            </div>
            <div className="flex items-center gap-4">
              <Text variant="small" tone="muted">
                {list.data?.length ?? book.data.totalCopies} copies
              </Text>
              <Button icon={Plus} loading={adding} onClick={add}>
                Add copy
              </Button>
            </div>
          </>
        ) : (
          <ListSkeleton rows={1} />
        )}
      </Card>

      <Card padding="none">
        {list.error ? (
          <AsyncError error={list.error} onRetry={list.reload} />
        ) : !list.data ? (
          <ListSkeleton rows={5} />
        ) : list.data.length ? (
          <DataTable
            label="Book copies"
            rows={list.data}
            rowKey={(row) => row.copy._id}
            dense
            mobileTitle={(row) => (
              <Text mono weight="medium">
                {row.copy.barcode}
              </Text>
            )}
            mobileStatus={(row) => statusBadge(row.copy.status)}
            mobileFields={[
              { key: "condition" },
              { key: "holder" },
              { key: "added" },
            ]}
            columns={[
              {
                key: "barcode",
                header: "Barcode",
                className: "w-28 whitespace-nowrap",
                sortValue: (row) => row.copy.barcode,
                render: (row) => (
                  <Text mono weight="medium">
                    {row.copy.barcode}
                  </Text>
                ),
              },
              {
                key: "status",
                header: "Status",
                className: "w-24",
                render: (row) => statusBadge(row.copy.status),
              },
              {
                key: "condition",
                header: "Condition",
                className: "w-32",
                render: (row) => (
                  <Select
                    label={`Condition for ${row.copy.barcode}`}
                    hideLabel
                    size="sm"
                    value={row.copy.condition}
                    onChange={(condition) =>
                      change(row, { condition }, "Condition updated")
                    }
                    options={[
                      { value: "good", label: "Good" },
                      { value: "fair", label: "Fair" },
                      { value: "poor", label: "Poor" },
                    ]}
                  />
                ),
              },
              {
                key: "holder",
                header: "Current holder",
                render: (row) =>
                  row.holder ? (
                    <div>
                      <Text>{row.holder.name}</Text>
                      <Text mono variant="small" tone="muted">
                        {row.holder.usn}
                      </Text>
                    </div>
                  ) : (
                    <Text tone="subtle">—</Text>
                  ),
              },
              {
                key: "added",
                header: "Added",
                className: "w-24 whitespace-nowrap",
                render: (row) =>
                  formatDate(row.copy.addedAt ?? "2024-06-01T00:00:00.000Z"),
              },
            ]}
            actions={(row) => (
              <Menu
                label={`Actions for ${row.copy.barcode}`}
                trigger={
                  <span className="flex size-10 items-center justify-center rounded-md text-ink-muted hover:bg-hover hover:text-ink">
                    <MoreHorizontal
                      aria-hidden
                      strokeWidth={1.5}
                      className="size-5"
                    />
                  </span>
                }
                items={[
                  {
                    label: "Mark damaged",
                    icon: TriangleAlert,
                    onSelect: () =>
                      change(
                        row,
                        { status: "damaged", condition: "poor" },
                        "Copy marked damaged",
                      ),
                  },
                  {
                    label: "Mark lost",
                    icon: CircleAlert,
                    onSelect: () =>
                      change(row, { status: "lost" }, "Copy marked lost"),
                  },
                  {
                    label: "Retire",
                    icon: Archive,
                    onSelect: () => setRetiring(row),
                  },
                ]}
              />
            )}
            actionsAreMenu
          />
        ) : (
          <EmptyState
            icon={Archive}
            title="No copies yet"
            description="Add the first copy to generate a ShelfStore barcode."
            action={
              <Button icon={Plus} onClick={add}>
                Add copy
              </Button>
            }
          />
        )}
      </Card>

      <Modal
        open={Boolean(retiring)}
        onClose={() => setRetiring(null)}
        title={
          retiring?.copy.status === "borrowed"
            ? "Copy is currently borrowed"
            : "Retire this copy?"
        }
        fullScreenOnMobile
        footer={
          <>
            <Button variant="secondary" onClick={() => setRetiring(null)}>
              Cancel
            </Button>
            <Button
              disabled={retiring?.copy.status === "borrowed"}
              onClick={retire}
            >
              Retire copy
            </Button>
          </>
        }
      >
        <Text tone="muted">
          {retiring?.copy.status === "borrowed"
            ? `${retiring.copy.barcode} must be returned before it can be retired.`
            : `${retiring?.copy.barcode} will remain in the audit history but cannot be issued again.`}
        </Text>
      </Modal>
    </div>
  )
}
