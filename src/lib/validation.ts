export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** VVCE USN, e.g. 4VV23CS001 */
export const USN_RE = /^4VV\d{2}[A-Z]{2}\d{3}$/

export function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Enter your email'
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email, like name@vvce.ac.in'
  return null
}

export function validatePassword(v: string): string | null {
  if (!v) return 'Enter your password'
  if (v.length < 6) return 'Use at least 6 characters'
  return null
}
