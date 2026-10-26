import { SearchX, SlidersHorizontal } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { BookCard } from "@/components/BookCard"
import { BookCardSkeleton } from "@/components/BookCardSkeleton"
import { FilterPanel, type Filters } from "@/components/FilterPanel"
import { Button } from "@/components/ui/Button"
import { AsyncError } from "@/components/ui/AsyncError"
import { Chip } from "@/components/ui/Chip"
import { EmptyState } from "@/components/ui/EmptyState"
import { Heading } from "@/components/ui/Heading"
import { Modal } from "@/components/ui/Modal"
import { SearchField } from "@/components/ui/SearchField"
import { Select } from "@/components/ui/Select"
import { Skeleton } from "@/components/ui/Skeleton"
import { Text } from "@/components/ui/Text"
import { useAsync } from "@/hooks/useAsync"
import {
  getGenres,
  getLanguages,
  searchBooks,
  type SortKey,
} from "@/services/api"

const sortOptions: Array<{ value: SortKey label: string }> = [
  { value: "relevance", label: "Most relevant" },
  { value: "title", label: "Title, A to Z" },
  { value: "newest", label: "Newest edition" },
  { value: "available", label: "Most copies available" },
]

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get("q") ?? ""
  const filters: Filters = {
    genres: params.getAll("genre"),
    language: params.get("lang") ?? "",
    availableOnly: params.get("avail") === "1",
  }
  const sort = params.get("sort") as SortKey || "relevance"
  const [mobileQuery, setMobileQuery] = useState(q)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => setMobileQuery(q), [q])

  const genres = useAsync(getGenres, [])
  const languages = useAsync(getLanguages, [])
  const results = useAsync(
    () =>
      searchBooks({
        q,
        genres: filters.genres,
        language: filters.language || undefined,
        availableOnly: filters.availableOnly,
        sort,
      }),
    [params.toString()],
  )

  const update = (next: { q?: string filters?: Filters sort?: SortKey }) => {
    const f = next.filters ?? filters
    const p = new URLSearchParams()
    const query = next.q ?? q
    if (query) p.set("q", query)
    f.genres.forEach((g) => p.append("genre", g))
    if (f.language) p.set("lang", f.language)
    if (f.availableOnly) p.set("avail", "1")
    const s = next.sort ?? sort
    if (s !== "relevance") p.set("sort", s)
    setParams(p, { replace: true })
  }

  const clearAll = () =>
    update({
      q: "",
      filters: { genres: [], language: "", availableOnly: false },
    })
  const activeFilterCount =
    filters.genres.length +
    (filters.language ? 1 : 0) +
    (filters.availableOnly ? 1 : 0)
  const hasChips = activeFilterCount > 0 || Boolean(q)
  const count = results.data?.length ?? 0

  const filterError = genres.error ?? languages.error
  const panel = filterError ? (
    <AsyncError
      error={filterError}
      onRetry={() => {
        genres.reload()
        languages.reload()
      }}
    />
  ) : genres.data && languages.data ? (
    <FilterPanel
      filters={filters}
      onChange={(f) => update({ filters: f })}
      genres={genres.data}
      languages={languages.data}
    />
  ) : (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-6" />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="md:hidden">
        <SearchField
          value={mobileQuery}
          onChange={setMobileQuery}
          onSubmit={(v) => update({ q: v })}
          autoFocus={!q}
        />
      </div>

      <div className="flex gap-10">
        <aside aria-label="Filters" className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-24">
            <Heading level={3} className="mb-5">
              Filters
            </Heading>
            {panel}
          </div>
        </aside>

        <section aria-label="Results" className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Heading level={1}>
                {q ? `Results for “${q}”` : "All books"}
              </Heading>
              <div className="mt-1 h-5">
                {results.loading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <Text variant="small" tone="muted">
                    {count} {count === 1 ? "book" : "books"}
                  </Text>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={SlidersHorizontal}
                className="md:hidden"
                onClick={() => setSheetOpen(true)}
              >
                {activeFilterCount
                  ? `Filters · ${activeFilterCount}`
                  : "Filters"}
              </Button>
              <Select
                label="Sort by"
                hideLabel
                size="sm"
                value={sort}
                onChange={(s) => update({ sort: s })}
                options={sortOptions}
                className="w-48"
              />
            </div>
          </div>

          {hasChips && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {q && (
                <Chip label={`“${q}”`} onRemove={() => update({ q: "" })} />
              )}
              {filters.genres.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  onRemove={() =>
                    update({
                      filters: {
                        ...filters,
                        genres: filters.genres.filter((x) => x !== g),
                      },
                    })
                  }
                />
              ))}
              {filters.language && (
                <Chip
                  label={filters.language}
                  onRemove={() =>
                    update({ filters: { ...filters, language: "" } })
                  }
                />
              )}
              {filters.availableOnly && (
                <Chip
                  label="Available now"
                  onRemove={() =>
                    update({ filters: { ...filters, availableOnly: false } })
                  }
                />
              )}
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            </div>
          )}

          <div className="mt-6">
            {results.error ? (
              <AsyncError error={results.error} onRetry={results.reload} />
            ) : results.loading ? (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }, (_, i) => (
                  <li key={i}>
                    <BookCardSkeleton />
                  </li>
                ))}
              </ul>
            ) : count === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No books match your search"
                description="Try a different title, author or ISBN, or remove some filters."
                action={
                  hasChips ? (
                    <Button variant="secondary" onClick={clearAll}>
                      Clear search and filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {results.data!.map((b) => (
                  <li key={b._id}>
                    <BookCard book={b} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                update({
                  filters: { genres: [], language: "", availableOnly: false },
                })
              }
            >
              Reset
            </Button>
            <Button onClick={() => setSheetOpen(false)}>
              {results.loading
                ? "Show results"
                : `Show ${count} ${count === 1 ? "book" : "books"}`}
            </Button>
          </>
        }
      >
        {panel}
      </Modal>
    </div>
  )
}
