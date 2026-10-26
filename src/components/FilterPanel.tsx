import type { GenreSummary } from '@/services/api'
import { Checkbox } from './ui/Checkbox'
import { Select } from './ui/Select'
import { Switch } from './ui/Switch'
import { Text } from './ui/Text'

export interface Filters {
  genres: string[]
  language: string
  availableOnly: boolean
}

interface FilterPanelProps {
  filters: Filters
  onChange: (next: Filters) => void
  genres: GenreSummary[]
  languages: string[]
}

export function FilterPanel({ filters, onChange, genres, languages }: FilterPanelProps) {
  const toggleGenre = (name: string, on: boolean) =>
    onChange({ ...filters, genres: on ? [...filters.genres, name] : filters.genres.filter((g) => g !== name) })

  return (
    <div className="flex flex-col gap-7">
      <Switch
        label="Available now"
        description="Hide books with no copies on the shelf"
        checked={filters.availableOnly}
        onChange={(availableOnly) => onChange({ ...filters, availableOnly })}
      />
      <fieldset className="flex flex-col">
        <legend className="mb-2">
          <Text variant="caption" tone="subtle" as="span">
            Subject
          </Text>
        </legend>
        {genres.map((g) => (
          <Checkbox
            key={g.name}
            label={g.name}
            meta={g.count}
            checked={filters.genres.includes(g.name)}
            onChange={(on) => toggleGenre(g.name, on)}
          />
        ))}
      </fieldset>
      <Select
        label="Language"
        value={filters.language}
        onChange={(language) => onChange({ ...filters, language })}
        options={[{ value: '', label: 'All languages' }, ...languages.map((l) => ({ value: l, label: l }))]}
      />
    </div>
  )
}
