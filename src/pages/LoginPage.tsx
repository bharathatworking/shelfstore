import { useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router"
import { AuthLayout } from "@/components/AuthLayout"
import { Button } from "@/components/ui/Button"
import { Text } from "@/components/ui/Text"
import { TextField } from "@/components/ui/TextField"
import { TextLink } from "@/components/ui/TextLink"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { validateEmail, validatePassword } from "@/lib/validation"

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{
    email?: string | null
    password?: string | null
  }>({})
  const [submitting, setSubmitting] = useState(false)

  if (user)
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/browse"} replace />
    )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors(next)
    if (next.email || next.password) return
    setSubmitting(true)
    try {
      const u = await login(email, password)
      navigate(u.role === "admin" ? "/admin" : "/browse", { replace: true })
    } catch (err) {
      toast("danger", "Could not sign in", (err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back to ShelfStore"
      subtitle="Sign in to find, reserve and renew books."
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <TextField
          label="College email"
          type="email"
          autoComplete="email"
          placeholder="name@vvce.ac.in"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() =>
            email && setErrors((x) => ({ ...x, email: validateEmail(email) }))
          }
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() =>
            password &&
            setErrors((x) => ({ ...x, password: validatePassword(password) }))
          }
        />
        <Button type="submit" fullWidth loading={submitting}>
          {submitting ? "Signing in" : "Sign in"}
        </Button>
        <Text variant="small" tone="subtle">
          Demo: sign in with any email. Use admin@shelfstore.in for the
          librarian view.
        </Text>
      </form>
      <Text
        variant="small"
        tone="muted"
        className="mt-8 border-t border-line pt-6"
      >
        <TextLink to="/forgot-password">Forgot password?</TextLink>
        <span className="mx-2 text-ink-subtle">·</span>
        New to the library? <TextLink to="/signup">Create an account</TextLink>
      </Text>
    </AuthLayout>
  )
}
