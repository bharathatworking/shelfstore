import {
  Archive,
  BookOpen,
  Copy,
  Edit3,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Badge } from "@/components/ui/Badge"
import { AsyncError } from "@/components/ui/AsyncError"
import { BookCover } from "@/components/ui/BookCover"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { EmptyState } from "@/components/ui/EmptyState"
import { Menu } from "@/components/ui/Menu"
import { SearchField } from "@/components/ui/SearchField"
import { Select } from "@/components/ui/Select"
import { Text } from "@/components/ui/Text"
import { useToast } from "@/context/ToastContext"
import { useAsync } from "@/hooks/useAsync"
import { archiveAdminBooks, GENRES, listAdminBooks } from "@/services/api"
import type { Book } from "@/types"

type Availability = "all" | "available" | "unavailable"

export function BooksPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [query, setQuery] = useState("")
  const [genre, setGenre] = useState("")
  const [availability, setAvailability] = useState<Availability>("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [version, setVersion] = useState(0)
  const result = useAsync(
    () =>
      listAdminBooks({
        q: query,
        genre: genre || undefined,
        availability,
        page,
      }),
    [query, genre, availability, page, version],
  )

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [query, genre, availability])

  const archive = async (ids: string[]) => {
    await archiveAdminBooks(ids)
    setSelected(new Set())
    setVersion((value) => value + 1)
    toast(
      "success",
      ids.length === 1 ? "Book archived" : "Books archived",
      "Archived titles no longer appear in the member catalogue.",
    )
  }

  const rowMenu = (book: Book) => (
    <Menu
      label={`Actions for ${book.title}`}
      trigger={
        <span className="flex size-10 items-center justify-center rounded-md text-ink-muted hover:bg-hover hover:text-ink">
          <MoreHorizontal aria-hidden strokeWidth={1.5} className="size-5" />
        </span>
      }
      items={[
        {
          label: "Edit",
          icon: Edit3,
          onSelect: () => navigate(`/admin/books/${book._id}/edit`),
        },
        {
          label: "Manage copies",
          icon: Copy,
          onSelect: () => navigate(`/admin/books/${book._id}/copies`),
        },
        {
          label: "View public page",
          icon: BookOpen,
          onSelect: () => navigate(`/books/${book._id}`),
        },
        {
          label: "Archive",
          icon: Archive,
          onSelect: () => archive([book._id]),
        },
      ]}
    />
  )

  const data = result.data
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <SearchField
          value={query}
          onChange={setQuery}
          onSubmit={setQuery}
          label="Search catalog"
          placeholder="Search title, author, ISBN or shelf"
          className="lg:max-w-search"
        />
        <Select
          label="Genre"
          hideLabel
          value={genre}
          onChange={setGenre}
          className="lg:w-52"
          options={[
            { value: "", label: "All genres" },
            ...GENRES.map((value) => ({ value, label: value })),
          ]}
        />
        <Select
          label="Availability"
          hideLabel
          value={availability}
          onChange={setAvailability}
          className="lg:w-48"
          options={[
            { value: "all", label: "All availability" },
            { value: "available", label: "Available" },
            { value: "unavailable", label: "No copies free" },
          ]}
        />
        <Button icon={Plus} to="/admin/books/new" className="lg:ml-auto">
          Add book
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-info-line bg-info-bg px-4 py-3">
          <Text variant="small" weight="medium" className="mr-auto">
            {selected.size} selected
          </Text>
          <Button
            variant="secondary"
            size="sm"
            icon={Archive}
            onClick={() => archive([...selected])}
          >
            Archive selected
          </Button>
        </div>
      )}

      <Card padding="none">
        {result.error ? (
          <AsyncError error={result.error} onRetry={result.reload} />
        ) : data?.rows.length ? (
          <DataTable
            label="Catalog books"
            rows={data.rows}
            rowKey={(book) => book._id}
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            mobileTitle={(book) => (
              <div className="flex min-w-0 gap-3">
                <div className="w-10 shrink-0">
                  <BookCover
                    title={book.title}
                    author={book.authors[0]}
                    color={book.coverColor}
                    size="xs"
                  />
                </div>
                <div className="min-w-0">
                  <Text serif className="truncate">
                    {book.title}
                  </Text>
                  <Text variant="small" tone="muted" className="truncate">
                    {book.authors.join(", ")}
                  </Text>
                </div>
              </div>
            )}
            mobileFields={[
              { key: "isbn" },
              { key: "copies" },
              { key: "shelf" },
            ]}
            mobileStatus={(book) => (
              <Badge tone="neutral">{book.genres[0]}</Badge>
            )}
            columns={[
              {
                key: "title",
                header: "Title",
                className: "min-w-0",
                sortValue: (book) => book.title,
                render: (book) => (
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-8 shrink-0">
                      <BookCover
                        title={book.title}
                        author={book.authors[0]}
                        color={book.coverColor}
                        size="xs"
                      />
                    </div>
                    <div className="min-w-0">
                      <Text serif className="truncate">
                        {book.title}
                      </Text>
                      <Text variant="small" tone="muted" className="truncate">
                        {book.authors.join(", ")}
                      </Text>
                    </div>
                  </div>
                ),
              },
              {
                key: "isbn",
                header: "ISBN",
                className: "w-36 whitespace-nowrap",
                render: (book) => (
                  <Text mono variant="small">
                    {book.isbn}
                  </Text>
                ),
              },
              {
                key: "genre",
                header: "Genre",
                className: "w-36",
                render: (book) => (
                  <Badge
                    tone="neutral"
                    className="min-w-0 max-w-full overflow-hidden"
                  >
                    <span className="block min-w-0 truncate">
                      {book.genres[0]}
                    </span>
                  </Badge>
                ),
              },
              {
                key: "copies",
                header: "Copies",
                className: "w-20 whitespace-nowrap",
                render: (book) =>
                  `${book.availableCopies} / ${book.totalCopies}`,
              },
              {
                key: "shelf",
                header: "Shelf",
                className: "w-24 whitespace-nowrap",
                render: (book) => (
                  <Text mono variant="small">
                    {book.shelfLocation}
                  </Text>
                ),
              },
            ]}
            actions={rowMenu}
            actionsAreMenu
            actionsAlwaysVisible
            actionColumnClassName="w-20"
          />
        ) : result.loading ? (
          <div className="p-8 text-center text-ink-muted">Loading catalog…</div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No books found"
            description="Change the filters or add a title to the catalog."
          />
        )}
      </Card>

      {data && data.total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Text variant="small" tone="muted">
            Showing {(data.page - 1) * data.pageSize + 1}–
            {Math.min(data.page * data.pageSize, data.total)} of {data.total}
          </Text>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={data.page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={data.page === data.pages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
