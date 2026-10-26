import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { TextField } from '@/components/ui/TextField'
import { TextLink } from '@/components/ui/TextLink'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { USN_RE, validateEmail, validatePassword } from '@/lib/validation'

type Field = 'name' | 'email' | 'usn' | 'password'

const validators: Record<Field, (v: string) => string | null> = {
  name: (v) => (v.trim().length < 2 ? 'Enter your full name' : null),
  email: validateEmail,
  usn: (v) => (!v.trim() ? 'Enter your USN' : USN_RE.test(v.trim().toUpperCase()) ? null : 'Use the format 4VV23CS001'),
  password: validatePassword,
}

export function SignupPage() {
  const { user, signup } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', usn: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string | null>>>({})
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/browse'} replace />

  const bind = (field: Field) => ({
    value: values[field],
    error: errors[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [field]: e.target.value })),
    onBlur: () => values[field] && setErrors((x) => ({ ...x, [field]: validators[field](values[field]) })),
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = Object.fromEntries((Object.keys(validators) as Field[]).map((f) => [f, validators[f](values[f])]))
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setSubmitting(true)
    try {
      await signup(values)
      toast('success', 'Account created', 'You can now reserve books.')
      navigate('/browse', { replace: true })
    } catch (err) {
      setErrors((x) => ({ ...x, email: (err as Error).message }))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create your library account" subtitle="For VVCE students. It takes a minute.">
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <TextField label="Full name" autoComplete="name" placeholder="Ananya Shetty" {...bind('name')} />
        <TextField label="College email" type="email" autoComplete="email" placeholder="name@vvce.ac.in" {...bind('email')} />
        <TextField
          label="USN"
          mono
          autoCapitalize="characters"
          placeholder="4VV23CS001"
          hint="University seat number, printed on your ID card"
          {...bind('usn')}
        />
        <TextField label="Password" type="password" autoComplete="new-password" hint="At least 6 characters" {...bind('password')} />
        <Button type="submit" fullWidth loading={submitting}>
          {submitting ? 'Creating account' : 'Create account'}
        </Button>
      </form>
      <Text variant="small" tone="muted" className="mt-8 border-t border-line pt-6">
        Already have an account? <TextLink to="/login">Sign in</TextLink>
      </Text>
    </AuthLayout>
  )
}
