import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import { cx } from "./cx"

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number
  align?: "left" | "right"
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Row actions, revealed on hover or keyboard focus. */
  actions?: (row: T) => ReactNode
  selectable?: boolean
  selected?: Set<string>
  onSelectedChange?: (next: Set<string>) => void
  defaultSort?: { key: string; dir: "asc" | "desc" }
  label: string
  /** Mobile card title. Defaults to the first column. */
  mobileTitle?: (row: T) => ReactNode
  /** Two or three fields shown below the mobile card title. */
  mobileFields?: Array<{ key: string; label?: string }>
  /** Status badge or status text shown beside the mobile card title. */
  mobileStatus?: (row: T) => ReactNode
  /** Tighter cells for tables inside narrow cards. */
  dense?: boolean
  /** The action renderer already provides its own overflow-menu trigger. */
  actionsAreMenu?: boolean
  rowClassName?: (row: T) => string | undefined
  actionColumnClassName?: string
  actionsAlwaysVisible?: boolean
}

const checkboxClass = "size-4 cursor-pointer accent-primary"

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  selectable,
  selected,
  onSelectedChange,
  defaultSort,
  label,
  mobileTitle,
  mobileFields,
  mobileStatus,
  dense = false,
  actionsAreMenu = false,
  rowClassName,
  actionColumnClassName,
  actionsAlwaysVisible = false,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(defaultSort)
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key)
    if (!col?.sortValue || !sort) return rows
    const dir = sort.dir === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const x = col.sortValue!(a)
      const y = col.sortValue!(b)
      return (x < y ? -1 : x > y ? 1 : 0) * dir
    })
  }, [rows, columns, sort])

  const allSelected =
    selectable && rows.length > 0 && rows.every((r) => selected?.has(rowKey(r)))
  const toggleAll = () =>
    onSelectedChange?.(allSelected ? new Set() : new Set(rows.map(rowKey)))
  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectedChange?.(next)
  }
  const cardFields = (
    mobileFields ??
    columns.slice(1, 4).map((c): { key: string; label?: string } => ({ key: c.key }))
  )
    .map(({ key, label: fieldLabel }) => {
      const column = columns.find((col) => col.key === key)
      return column ? { column, label: fieldLabel ?? column.header } : null
    })
    .filter((field): field is { column: Column<T>; label: string } =>
      Boolean(field),
    )
  const titleColumn = columns[0]

  return (
    <>
      <div className="hidden md:block">
        <table
          aria-label={label}
          className={cx(
            "w-full table-fixed border-collapse text-left text-body tabular-nums",
          )}
        >
          <thead>
            <tr className="h-10 border-b border-line bg-sunken">
              {selectable && (
                <th scope="col" className="w-12 pl-4">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={Boolean(allSelected)}
                    onChange={toggleAll}
                    className={checkboxClass}
                  />
                </th>
              )}
              {columns.map((col) => {
                const active = sort?.key === col.key
                const SortIcon = active
                  ? sort!.dir === "asc"
                    ? ArrowUp
                    : ArrowDown
                  : ChevronsUpDown
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      active
                        ? sort!.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={cx(
                      dense ? "px-2" : "px-4",
                      "text-caption font-medium uppercase tracking-wider text-ink-muted",
                      col.align === "right" && "text-right",
                      col.className,
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort({
                            key: col.key,
                            dir: active && sort!.dir === "asc" ? "desc" : "asc",
                          })
                        }
                        className={cx(
                          "inline-flex items-center gap-1 uppercase hover:text-ink",
                          active && "text-ink",
                        )}
                      >
                        {col.header}
                        <SortIcon
                          aria-hidden
                          strokeWidth={1.5}
                          className="size-3.5"
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
              {actions && (
                <th
                  scope="col"
                  className={cx(
                    dense ? "w-12 px-2" : "w-24 px-4",
                    actionColumnClassName,
                  )}
                >
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((row) => {
              const id = rowKey(row)
              return (
                <tr
                  key={id}
                  className={cx(
                    "group h-13 transition-colors hover:bg-hover",
                    rowClassName?.(row),
                  )}
                >
                  {selectable && (
                    <td className="w-12 pl-4">
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selected?.has(id) ?? false}
                        onChange={() => toggle(id)}
                        className={checkboxClass}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cx(
                        dense ? "px-2 py-2" : "px-4 py-2",
                        col.align === "right" && "text-right",
                        col.className,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                  {actions && (
                    <td
                      className={cx(
                        "text-right",
                        dense ? "w-12 px-2" : "px-4",
                        actionColumnClassName,
                      )}
                    >
                      <div
                        className={cx(
                          "flex justify-end gap-2",
                          !actionsAlwaysVisible &&
                            "opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100",
                        )}
                      >
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div
        className="flex flex-col gap-3 p-3 md:hidden"
        aria-label={`${label}, card view`}
      >
        {selectable && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-line bg-sunken px-3 text-small font-medium text-ink">
            <input
              type="checkbox"
              aria-label="Select all rows"
              checked={Boolean(allSelected)}
              onChange={toggleAll}
              className={checkboxClass}
            />
            Select all
          </label>
        )}
        {sorted.map((row) => {
          const id = rowKey(row)
          return (
            <article
              key={id}
              className={cx(
                "rounded-md border border-line bg-surface p-4",
                rowClassName?.(row),
              )}
            >
              <div className="flex items-start gap-3">
                {selectable && (
                  <label className="-m-2 flex size-11 shrink-0 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      checked={selected?.has(id) ?? false}
                      onChange={() => toggle(id)}
                      className={checkboxClass}
                    />
                  </label>
                )}
                <div className="min-w-0 flex-1">
                  {mobileTitle ? mobileTitle(row) : titleColumn?.render(row)}
                </div>
                {mobileStatus?.(row)}
                {actions && actionsAreMenu && actions(row)}
                {actions && !actionsAreMenu && (
                  <details className="group/menu relative shrink-0">
                    <summary
                      aria-label="Row actions"
                      className="-m-2 flex size-11 cursor-pointer list-none items-center justify-center rounded-md text-ink-muted hover:bg-hover hover:text-ink"
                    >
                      <MoreHorizontal
                        aria-hidden
                        strokeWidth={1.5}
                        className="size-5"
                      />
                    </summary>
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-md border border-line bg-surface p-2 shadow-pop">
                      {actions(row)}
                    </div>
                  </details>
                )}
              </div>
              <dl className="mt-4 grid gap-3 border-t border-line pt-4">
                {cardFields.map(({ column, label: fieldLabel }) => (
                  <div
                    key={column.key}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4"
                  >
                    <dt className="text-small text-ink-subtle">{fieldLabel}</dt>
                    <dd className="min-w-0 text-right text-body text-ink">
                      {column.render(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          )
        })}
      </div>
    </>
  )
}
