import { BookOpen } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { BookShelfRow } from "@/components/BookShelfRow"
import { GenreTile } from "@/components/GenreTile"
import { AsyncError } from "@/components/ui/AsyncError"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Heading } from "@/components/ui/Heading"
import { SearchField } from "@/components/ui/SearchField"
import { Skeleton } from "@/components/ui/Skeleton"
import { Text } from "@/components/ui/Text"
import { useCurrentUser } from "@/context/AuthContext"
import { useAsync } from "@/hooks/useAsync"
import { firstName, greeting } from "@/lib/format"
import { getGenres, getMostBorrowed, getNewArrivals } from "@/services/api"

export function BrowsePage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const genres = useAsync(getGenres, [])
  const arrivals = useAsync(() => getNewArrivals(10), [])
  const popular = useAsync(() => getMostBorrowed(10), [])

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-content flex-col gap-12">
      <section className="flex flex-col gap-5 pt-2">
        <div>
          <Text variant="caption" tone="accent">
            VVCE central library
          </Text>
          <Heading level={1} className="mt-1">
            {greeting()}, {firstName(user.name)}
          </Heading>
          <Text tone="muted" className="mt-1">
            Over 40 titles across seven subjects, ready to reserve and collect.
          </Text>
        </div>
        <SearchField
          size="lg"
          value={query}
          onChange={setQuery}
          onSubmit={(q) =>
            navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
          }
          placeholder="Search by title, author, ISBN or shelf code"
          className="max-w-2xl"
        />
      </section>

      <section aria-labelledby="genres-heading" className="flex flex-col gap-4">
        <Heading level={2} id="genres-heading">
          Browse by subject
        </Heading>
        {genres.error ? (
          <Card padding="none">
            <AsyncError error={genres.error} onRetry={genres.reload} />
          </Card>
        ) : genres.data?.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={BookOpen}
              title="No subjects yet"
              description="Subjects will appear when books are added."
            />
          </Card>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {genres.data
              ? genres.data.map((g) => (
                  <li key={g.name}>
                    <GenreTile name={g.name} count={g.count} />
                  </li>
                ))
              : Array.from({ length: 7 }, (_, i) => (
                  <li key={i}>
                    <Skeleton className="h-27 rounded-md" />
                  </li>
                ))}
          </ul>
        )}
      </section>

      <BookShelfRow
        title="New arrivals"
        books={arrivals.data}
        seeAllTo="/search?sort=newest"
        error={arrivals.error}
        onRetry={arrivals.reload}
      />
      <BookShelfRow
        title="Most borrowed this month"
        books={popular.data}
        error={popular.error}
        onRetry={popular.reload}
      />
    </div>
  )
}
