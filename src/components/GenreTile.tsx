import { Link } from "react-router"
import { genreIcons } from "./genreIcons"
import { Library } from "lucide-react"

export function GenreTile({ name, count }: { name: string count: number }) {
  const Icon = genreIcons[name] ?? Library
  return (
    <Link
      to={`/genres/${encodeURIComponent(name)}`}
      className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4 transition-colors hover:bg-hover"
    >
      <Icon aria-hidden strokeWidth={1.5} className="size-5 text-primary" />
      <span className="flex flex-col">
        <span className="text-body font-medium text-ink">{name}</span>
        <span className="text-small text-ink-subtle">
          {count} {count === 1 ? "book" : "books"}
        </span>
      </span>
    </Link>
  )
}
