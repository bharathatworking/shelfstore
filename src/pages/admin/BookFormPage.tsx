import { Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { BookCover } from "@/components/ui/BookCover"
import { AsyncError } from "@/components/ui/AsyncError"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Checkbox } from "@/components/ui/Checkbox"
import { Heading } from "@/components/ui/Heading"
import { IconButton } from "@/components/ui/IconButton"
import { Modal } from "@/components/ui/Modal"
import { Select } from "@/components/ui/Select"
import { Text } from "@/components/ui/Text"
import { Textarea } from "@/components/ui/Textarea"
import { TextField } from "@/components/ui/TextField"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import {
  createAdminBook,
  GENRES,
  getAdminBook,
  isDuplicateIsbn,
  lookupIsbn,
  updateAdminBook,
  type AdminBookInput,
} from "@/services/api"

const coverColors = [
  "#2E3F5C",
  "#34553F",
  "#8A4B2E",
  "#4A5662",
  "#5B3A52",
  "#94702F",
]

const emptyBook: AdminBookInput = {
  title: "",
  authors: [""],
  isbn: "",
  genres: [],
  publisher: "",
  year: new Date().getFullYear(),
  language: "English",
  description: "",
  shelfLocation: "",
  coverColor: coverColors[0],
  copies: 1,
}

export function BookFormPage() {
  const { bookId } = useParams()
  const editing = Boolean(bookId)
  const navigate = useNavigate()
  const toast = useToast()
  const existing = useAsync(
    () => (bookId ? getAdminBook(bookId) : Promise.resolve(null)),
    [bookId],
  )
  const [form, setForm] = useState<AdminBookInput>(emptyBook)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)

  useEffect(() => {
    if (!existing.data) return
    setForm({
      title: existing.data.title,
      authors: existing.data.authors,
      isbn: existing.data.isbn,
      genres: existing.data.genres,
      publisher: existing.data.publisher,
      year: existing.data.year,
      language: existing.data.language,
      description: existing.data.description,
      shelfLocation: existing.data.shelfLocation,
      coverColor: existing.data.coverColor,
    })
    setDirty(false)
  }, [existing.data])

  useEffect(() => {
    if (!form.isbn.trim()) return setDuplicate(false)
    const timeout = window.setTimeout(() => {
      isDuplicateIsbn(form.isbn, bookId).then(setDuplicate)
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [form.isbn, bookId])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const update = <K extends keyof AdminBookInput,>(
    key: K,
    value: AdminBookInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }

  const lookUp = async () => {
    setLookingUp(true)
    try {
      const found = await lookupIsbn(form.isbn)
      setForm((current) => ({ ...current, ...found, isbn: current.isbn }))
      setDirty(true)
      toast(
        "success",
        "ISBN details found",
        "Review the details before saving.",
      )
    } catch (error) {
      toast("danger", "Lookup failed", (error as Error).message)
    } finally {
      setLookingUp(false)
    }
  }

  const save = async () => {
    if (
      !form.title.trim() ||
      !form.isbn.trim() ||
      !form.authors.some((a) => a.trim())
    ) {
      return toast(
        "danger",
        "Add the required details",
        "Title, at least one author and ISBN are required.",
      )
    }
    if (duplicate)
      return toast(
        "danger",
        "Duplicate ISBN",
        "Open the existing title instead of creating another record.",
      )
    setSaving(true)
    try {
      const input = {
        ...form,
        title: form.title.trim(),
        isbn: form.isbn.trim(),
        authors: form.authors.map((author) => author.trim()).filter(Boolean),
      }
      const book = bookId
        ? await updateAdminBook(bookId, input)
        : await createAdminBook(input)
      setDirty(false)
      toast(
        "success",
        editing ? "Book updated" : "Book added",
        `${book.title} is saved in the catalog.`,
      )
      navigate("/admin/books", { replace: true })
    } catch (error) {
      toast("danger", "Could not save book", (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    if (dirty) setDiscardOpen(true)
    else navigate("/admin/books")
  }

  if (editing && existing.error)
    return (
      <Card padding="none">
        <AsyncError error={existing.error} onRetry={existing.reload} />
      </Card>
    )

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card as="section">
          <div className="flex flex-col gap-5">
            <Heading level={2}>Book details</Heading>
            <TextField
              label="Title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              required
            />
            <div className="flex flex-col gap-2">
              <Text variant="small" weight="medium">
                Authors
              </Text>
              {form.authors.map((author, index) => (
                <div key={index} className="flex items-end gap-2">
                  <TextField
                    label={`Author ${index + 1}`}
                    className="flex-1"
                    value={author}
                    onChange={(event) => {
                      const next = [...form.authors]
                      next[index] = event.target.value
                      update("authors", next)
                    }}
                  />
                  {form.authors.length > 1 && (
                    <IconButton
                      icon={Trash2}
                      label={`Remove author ${index + 1}`}
                      onClick={() =>
                        update(
                          "authors",
                          form.authors.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        )
                      }
                    />
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                icon={Plus}
                className="self-start"
                onClick={() => update("authors", [...form.authors, ""])}
              >
                Add author
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <TextField
                label="ISBN"
                mono
                value={form.isbn}
                error={
                  duplicate ? "This ISBN already exists in the catalog." : null
                }
                onChange={(event) => update("isbn", event.target.value)}
              />
              <Button
                variant="secondary"
                icon={Search}
                loading={lookingUp}
                onClick={lookUp}
                className="sm:mt-6"
              >
                Look up
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Publisher"
                value={form.publisher}
                onChange={(event) => update("publisher", event.target.value)}
              />
              <TextField
                label="Year"
                type="number"
                value={form.year}
                onChange={(event) => update("year", Number(event.target.value))}
              />
            </div>
            <Select
              label="Language"
              value={form.language}
              onChange={(value) => update("language", value)}
              options={[
                { value: "English", label: "English" },
                { value: "Kannada", label: "Kannada" },
                { value: "Hindi", label: "Hindi" },
              ]}
            />
            <fieldset>
              <legend className="mb-2 text-small font-medium text-ink">
                Genres
              </legend>
              <div className="grid gap-x-5 sm:grid-cols-2">
                {GENRES.map((genre) => (
                  <Checkbox
                    key={genre}
                    label={genre}
                    checked={form.genres.includes(genre)}
                    onChange={(checked) =>
                      update(
                        "genres",
                        checked
                          ? [...form.genres, genre]
                          : form.genres.filter((item) => item !== genre),
                      )
                    }
                  />
                ))}
              </div>
            </fieldset>
            <Textarea
              label="Description"
              rows={6}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </div>
        </Card>

        <Card as="section">
          <div className="flex flex-col gap-5">
            <Heading level={2}>Cover and copies</Heading>
            <div className="mx-auto w-40">
              <BookCover
                title={form.title || "Book title"}
                author={form.authors.filter(Boolean).join(", ") || "Author"}
                color={form.coverColor}
                size="lg"
              />
            </div>
            <fieldset>
              <legend className="mb-2 text-small font-medium text-ink">
                Cover colour
              </legend>
              <div className="flex flex-wrap gap-3">
                {coverColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use cover colour ${color}`}
                    aria-pressed={form.coverColor === color}
                    onClick={() => update("coverColor", color)}
                    className="size-11 rounded-md border-2 border-surface outline outline-line transition-transform hover:scale-105 aria-pressed:outline-primary"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </fieldset>
            <TextField
              label="Shelf location"
              mono
              value={form.shelfLocation}
              placeholder="e.g. CS-142"
              onChange={(event) =>
                update("shelfLocation", event.target.value.toUpperCase())
              }
            />
            {!editing && (
              <TextField
                label="Number of copies"
                type="number"
                min={0}
                max={99}
                value={form.copies ?? 0}
                onChange={(event) =>
                  update("copies", Number(event.target.value))
                }
              />
            )}
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-end gap-2 border-t border-line bg-surface px-4 py-3 md:px-6 lg:left-(--container-sidebar) lg:px-8">
        <Button variant="secondary" onClick={cancel}>
          Cancel
        </Button>
        <Button loading={saving} onClick={save}>
          {editing ? "Save changes" : "Add book"}
        </Button>
      </div>

      <Modal
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard unsaved changes?"
        fullScreenOnMobile
        footer={
          <>
            <Button variant="secondary" onClick={() => setDiscardOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={() => navigate("/admin/books")}>
              Discard changes
            </Button>
          </>
        }
      >
        <Text tone="muted">Changes to this book have not been saved.</Text>
      </Modal>
    </div>
  )
}
