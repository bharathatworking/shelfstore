import {
  Bell,
  BookOpen,
  Bookmark,
  Edit3,
  HandCoins,
  History,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { Avatar } from "@/components/ui/Avatar"
import { AsyncError } from "@/components/ui/AsyncError"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Heading } from "@/components/ui/Heading"
import { StatCard } from "@/components/ui/StatCard"
import { Text } from "@/components/ui/Text"
import { TextField } from "@/components/ui/TextField"
import { TextLink } from "@/components/ui/TextLink"
import { useAuth, useCurrentUser } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { formatDate, rupees } from "@/lib/format"
import { getProfile } from "@/services/api"

export function ProfilePage() {
  const user = useCurrentUser()
  const { logout, updateAccount } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const profile = useAsync(() => getProfile(user._id), [user._id])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [saving, setSaving] = useState(false)
  const p = profile.data

  const save = async () => {
    setSaving(true)
    try {
      await updateAccount({ name, email })
      setEditing(false)
      profile.reload()
      toast("success", "Profile updated", "Your details were saved.")
    } catch (error) {
      toast("danger", "Could not update profile", (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const signOut = () => {
    logout()
    navigate("/login", { replace: true })
  }

  if (profile.error)
    return (
      <Card padding="none">
        <AsyncError error={profile.error} onRetry={profile.reload} />
      </Card>
    )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading level={1}>Profile</Heading>
        {!editing && (
          <Button
            variant="secondary"
            size="sm"
            icon={Edit3}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      <Card>
        {editing ? (
          <div className="flex flex-col gap-4">
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setName(user.name)
                  setEmail(user.email)
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
              <Button loading={saving} onClick={save}>
                Save changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0 flex-1">
              <Heading level={2}>{user.name}</Heading>
              <Text mono variant="small" tone="muted">
                {user.usn}
              </Text>
              <Text variant="small" tone="muted" className="truncate">
                {user.email}
              </Text>
              <Text variant="small" tone="subtle" className="mt-1">
                Member since {formatDate(user.joinedAt)}
              </Text>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Borrowed now" value={p?.activeCount} icon={BookOpen} />
        <StatCard label="On hold" value={p?.holdCount} icon={Bookmark} />
        <StatCard
          label="All-time loans"
          value={p?.totalBorrowed}
          icon={History}
        />
        <StatCard
          label="Fines due"
          value={p ? rupees(p.totalFines) : undefined}
          icon={HandCoins}
          tone={p?.totalFines ? "danger" : "default"}
        />
      </div>

      <Card padding="none">
        <div className="border-b border-line px-5 py-4">
          <Heading level={3}>Account</Heading>
        </div>
        <div className="flex flex-col divide-y divide-line">
          <TextLink
            to="/my-fines"
            className="flex min-h-12 items-center gap-3 px-5 py-3 no-underline hover:bg-hover"
          >
            <HandCoins aria-hidden strokeWidth={1.5} className="size-4" />
            My fines
          </TextLink>
          <TextLink
            to="/notifications"
            className="flex min-h-12 items-center gap-3 px-5 py-3 no-underline hover:bg-hover"
          >
            <Bell aria-hidden strokeWidth={1.5} className="size-4" />
            Notifications
          </TextLink>
          <button
            type="button"
            onClick={signOut}
            className="flex min-h-12 items-center gap-3 px-5 py-3 text-left font-medium text-ink hover:bg-hover"
          >
            <LogOut aria-hidden strokeWidth={1.5} className="size-4" />
            Log out
          </button>
        </div>
      </Card>
    </div>
  )
}
