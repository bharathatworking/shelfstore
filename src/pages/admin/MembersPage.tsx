import { UserRoundSearch } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { MemberIdentity } from "@/components/admin/MemberIdentity"
import { Badge } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { Card } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { EmptyState } from "@/components/ui/EmptyState"
import { SearchField } from "@/components/ui/SearchField"
import { Select } from "@/components/ui/Select"
import { Text } from "@/components/ui/Text"
import { TextLink } from "@/components/ui/TextLink"
import { useAsync } from "@/hooks/useAsync"
import { formatDate, rupees } from "@/lib/format"
import { listAdminMembers } from "@/services/api"

type StatusFilter = "all" | "active" | "suspended"

export function MembersPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const members = useAsync(
    () => listAdminMembers({ q: query, status }),
    [query, status],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row">
        <SearchField
          value={query}
          onChange={setQuery}
          onSubmit={setQuery}
          label="Search members"
          placeholder="Search name, USN or email"
          className="md:max-w-search"
        />
        <Select
          label="Member status"
          hideLabel
          value={status}
          onChange={setStatus}
          className="md:w-48"
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ]}
        />
      </div>

      <Card padding="none">
        {members.error ? (
          <AsyncError error={members.error} onRetry={members.reload} />
        ) : members.data?.length ? (
          <DataTable
            label="Library members"
            rows={members.data}
            rowKey={(row) => row.user._id}
            rowClassName={(row) =>
              row.user.status === "suspended" ? "opacity-60" : undefined
            }
            mobileTitle={(row) => <MemberIdentity user={row.user} />}
            mobileStatus={(row) => (
              <Badge tone={row.user.status === "active" ? "success" : "danger"}>
                {row.user.status === "active" ? "Active" : "Suspended"}
              </Badge>
            )}
            mobileFields={[
              { key: "books" },
              { key: "fines" },
              { key: "joined" },
            ]}
            columns={[
              {
                key: "name",
                header: "Member",
                sortValue: (row) => row.user.name,
                render: (row) => (
                  <TextLink to={`/admin/members/${row.user._id}`}>
                    {row.user.name}
                  </TextLink>
                ),
              },
              {
                key: "usn",
                header: "USN",
                className: "whitespace-nowrap",
                render: (row) => (
                  <Text mono variant="small">
                    {row.user.usn}
                  </Text>
                ),
              },
              {
                key: "email",
                header: "Email",
                className: "truncate",
                render: (row) => row.user.email,
              },
              {
                key: "books",
                header: "Books out",
                align: "right",
                className: "w-24",
                render: (row) => row.booksOut,
              },
              {
                key: "fines",
                header: "Fines",
                align: "right",
                className: "w-24",
                render: (row) => (
                  <span className={row.fines ? "text-danger" : "text-ink"}>
                    {rupees(row.fines)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                className: "w-28",
                render: (row) => (
                  <Badge
                    tone={row.user.status === "active" ? "success" : "danger"}
                  >
                    {row.user.status === "active" ? "Active" : "Suspended"}
                  </Badge>
                ),
              },
              {
                key: "joined",
                header: "Joined",
                className: "w-28 whitespace-nowrap",
                render: (row) => formatDate(row.user.joinedAt),
              },
            ]}
            actions={(row) => (
              <button
                type="button"
                className="text-small font-medium text-primary hover:text-primary-hover"
                onClick={() => navigate(`/admin/members/${row.user._id}`)}
              >
                View
              </button>
            )}
          />
        ) : members.loading ? (
          <div className="p-8 text-center text-ink-muted">Loading members…</div>
        ) : (
          <EmptyState
            icon={UserRoundSearch}
            title="No members found"
            description="Try another name, USN, email or status."
          />
        )}
      </Card>
    </div>
  )
}
