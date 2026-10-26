import { MailCheck } from "lucide-react"
import { useState, type FormEvent } from "react"
import { AuthLayout } from "@/components/AuthLayout"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Text } from "@/components/ui/Text"
import { TextField } from "@/components/ui/TextField"
import { TextLink } from "@/components/ui/TextLink"
import { requestPasswordReset } from "@/services/api"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    await requestPasswordReset(email)
    setBusy(false)
    setSent(true)
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your college email and we’ll send reset instructions."
    >
      {sent ? (
        <Card className="flex gap-3">
          <MailCheck
            aria-hidden
            strokeWidth={1.5}
            className="size-5 shrink-0 text-success"
          />
          <div>
            <Text weight="medium">Check your inbox</Text>
            <Text variant="small" tone="muted">
              If an account exists for {email}, reset instructions are on the
              way.
            </Text>
          </div>
        </Card>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <TextField
            label="College email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" fullWidth loading={busy}>
            Send reset instructions
          </Button>
        </form>
      )}
      <Text variant="small" tone="muted" className="mt-6">
        <TextLink to="/login">Back to sign in</TextLink>
      </Text>
    </AuthLayout>
  )
}
