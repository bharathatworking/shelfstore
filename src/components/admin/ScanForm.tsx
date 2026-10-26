import { ScanBarcode } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Button } from "../ui/Button"
import { TextField } from "../ui/TextField"

interface ScanFormProps {
  label: string
  hint: string
  placeholder: string
  onSubmit: (code: string) => void
  loading: boolean
  initial?: string
}

/** Large autofocused scan input. Barcode scanners type the code and press Enter, so a form submit is all it needs. */
export function ScanForm({
  label,
  hint,
  placeholder,
  onSubmit,
  loading,
  initial = "",
}: ScanFormProps) {
  const [value, setValue] = useState(initial)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }
  return (
    <form
      onSubmit={submit}
      className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start"
    >
      <div className="min-w-0 flex-1">
        <TextField
          label={label}
          hint={hint}
          icon={ScanBarcode}
          mono
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onFocus={(e) => e.target.select()}
        />
      </div>
      <Button type="submit" loading={loading} className="sm:mt-6">
        Find
      </Button>
    </form>
  )
}
