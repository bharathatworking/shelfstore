import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { AsyncError } from "@/components/ui/AsyncError"
import { Card } from "@/components/ui/Card"
import { Heading } from "@/components/ui/Heading"
import { Switch } from "@/components/ui/Switch"
import { Tabs } from "@/components/ui/Tabs"
import { Text } from "@/components/ui/Text"
import { TextField } from "@/components/ui/TextField"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { getSettings, updateSettings } from "@/services/api"
import type { Settings } from "@/types"

type SettingsTab = "borrowing" | "holds" | "fines" | "approvals"

export function SettingsPage() {
  const toast = useToast()
  const current = useAsync(getSettings, [])
  const [tab, setTab] = useState<SettingsTab>("borrowing")
  const [form, setForm] = useState<Settings | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (current.data && !dirty) setForm(current.data)
  }, [current.data, dirty])

  const number = (
    key: keyof Pick<Settings, "loanPeriodDays" | "maxBooksPerUser" | "maxRenewals" | "holdHours" | "finePerDay" | "fineBlockThreshold">,
    value: number,
  ) => {
    setForm((settings) => (settings ? { ...settings, [key]: value } : settings))
    setDirty(true)
  }

  const save = async () => {
    if (!form) return
    setSaving(true)
    try {
      await updateSettings(form)
      setDirty(false)
      current.reload()
      toast(
        "success",
        "Settings saved",
        "New requests and loans now use these rules.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (current.error)
    return (
      <Card padding="none">
        <AsyncError error={current.error} onRetry={current.reload} />
      </Card>
    )

  if (!form)
    return (
      <Card>
        <Text tone="muted">Loading settings…</Text>
      </Card>
    )

  return (
    <div className="flex flex-col gap-6 pb-24">
      <Tabs
        label="Settings sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "borrowing", label: "Borrowing" },
          { id: "holds", label: "Holds" },
          { id: "fines", label: "Fines" },
          { id: "approvals", label: "Approvals" },
        ]}
      />

      <Card className="max-w-workflow">
        {tab === "borrowing" && (
          <div className="flex flex-col gap-5">
            <div>
              <Heading level={2}>Borrowing rules</Heading>
              <Text tone="muted" className="mt-1">
                Rules applied when books are issued and renewed.
              </Text>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Loan period in days"
                type="number"
                min={1}
                value={form.loanPeriodDays}
                onChange={(event) =>
                  number("loanPeriodDays", Number(event.target.value))
                }
              />
              <TextField
                label="Maximum books per member"
                type="number"
                min={1}
                value={form.maxBooksPerUser}
                onChange={(event) =>
                  number("maxBooksPerUser", Number(event.target.value))
                }
              />
              <TextField
                label="Maximum renewals"
                type="number"
                min={0}
                value={form.maxRenewals}
                onChange={(event) =>
                  number("maxRenewals", Number(event.target.value))
                }
              />
            </div>
          </div>
        )}

        {tab === "holds" && (
          <div className="flex flex-col gap-5">
            <div>
              <Heading level={2}>Hold window</Heading>
              <Text tone="muted" className="mt-1">
                How long an approved book waits at the circulation desk.
              </Text>
            </div>
            <TextField
              label="Hold duration in hours"
              type="number"
              min={1}
              className="max-w-xs"
              value={form.holdHours}
              onChange={(event) =>
                number("holdHours", Number(event.target.value))
              }
            />
          </div>
        )}

        {tab === "fines" && (
          <div className="flex flex-col gap-5">
            <div>
              <Heading level={2}>Fine rules</Heading>
              <Text tone="muted" className="mt-1">
                Daily overdue charge and the balance that pauses borrowing.
              </Text>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Fine per day in rupees"
                type="number"
                min={0}
                value={form.finePerDay}
                onChange={(event) =>
                  number("finePerDay", Number(event.target.value))
                }
              />
              <TextField
                label="Block threshold in rupees"
                type="number"
                min={0}
                value={form.fineBlockThreshold}
                onChange={(event) =>
                  number("fineBlockThreshold", Number(event.target.value))
                }
              />
            </div>
          </div>
        )}

        {tab === "approvals" && (
          <div className="flex flex-col gap-5">
            <div>
              <Heading level={2}>Request approvals</Heading>
              <Text tone="muted" className="mt-1">
                Choose whether routine requests need a librarian decision.
              </Text>
            </div>
            <div className="rounded-md border border-line p-4">
              <Switch
                label="Require manual approval for every request"
                description="When off, requests that pass every rule are approved instantly. Exceptions always come to you."
                checked={form.requireManualApproval}
                onChange={(checked) => {
                  setForm((settings) =>
                    settings
                      ? { ...settings, requireManualApproval: checked }
                      : settings,
                  )
                  setDirty(true)
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-end gap-2 border-t border-line bg-surface px-4 py-3 md:px-6 lg:left-(--container-sidebar) lg:px-8">
          <Text
            variant="small"
            tone="muted"
            className="mr-auto hidden sm:block"
          >
            You have unsaved changes
          </Text>
          <Button
            variant="secondary"
            onClick={() => {
              setForm(current.data ?? form)
              setDirty(false)
            }}
          >
            Discard
          </Button>
          <Button loading={saving} onClick={save}>
            Save settings
          </Button>
        </div>
      )}
    </div>
  )
}
