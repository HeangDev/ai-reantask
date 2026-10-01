import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Avatar from '@/components/ui/Avatar'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import { ChevronDownIcon, EditIcon, TrashIcon } from '@/components/ui/icons'

export interface Column<T> {
  key: string
  header: string
  /** Fixed width (any CSS length). Leave out for the one column that takes the remaining space. */
  width?: string
  /** Makes the column sortable by this value. */
  sortValue?: (row: T) => string
  /** The person column: avatar, name button (opens the row) and a subtitle line. */
  primary?: boolean
  cell?: (row: T) => ReactNode
  cellClassName?: string
  /** Hide this column on windows narrower than this, so the table fits without a sideways scrollbar. */
  hideBelow?: 'lg' | 'xl'
}

export interface TableLabels {
  selectAll: string
  selectRow: (name: string) => string
  actions: string
  edit: string
  delete: string
  rowsPerPage: string
  range: (from: number, to: number, total: number) => string
  prev: string
  next: string
}

interface Props<T extends { id: string }> {
  /** Already filtered by the page. */
  rows: T[]
  columns: Column<T>[]
  getName: (row: T) => string
  getSubtitle: (row: T) => string
  /** Key of the column the table is sorted by at first. */
  initialSort: string
  labels: TableLabels
  selected: ReadonlySet<string>
  onSelectedChange: (ids: Set<string>) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  /** Below this width the table scrolls sideways. */
  minWidth?: string
  /** Same, as classes, for tables whose minimum changes with the window (columns that hide on small screens). Wins over minWidth. */
  minWidthClass?: string
  /** Show an initials avatar in the primary column. */
  showAvatar?: boolean
  /** Extra buttons shown before Edit and Delete in each row. */
  renderActions?: (row: T) => ReactNode
}

type Direction = 'asc' | 'desc'

const pageSizes = [5, 10, 25]
const SELECT_WIDTH = '3rem'
const ACTIONS_WIDTH = '6rem'
const ACTIONS_WIDTH_WITH_EXTRA = '8.5rem'
// Full class names, written out so Tailwind can see them.
const hideCell = { lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' }
const hideCol = { lg: 'hidden lg:table-column', xl: 'hidden xl:table-column' }
const tableClass = 'w-full table-fixed border-collapse text-left text-[13px]'
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent'
const iconButton = `rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg ${focusRing} [&>svg]:h-4 [&>svg]:w-4`

export default function DataTable<T extends { id: string }>({
  rows: allRows,
  columns,
  getName,
  getSubtitle,
  initialSort,
  labels,
  selected,
  onSelectedChange,
  onOpen,
  onEdit,
  onDelete,
  minWidth = '64rem',
  minWidthClass,
  showAvatar = true,
  renderActions,
}: Props<T>) {
  const [sort, setSort] = useState<{ key: string; direction: Direction }>({ key: initialSort, direction: 'asc' })
  const bodyRef = useRef<HTMLDivElement>(null)
  // Width of the body's scrollbar (0 when it fits), so the header can leave the same space and stay aligned.
  const [scrollbarWidth, setScrollbarWidth] = useState(0)
  const [pageSize, setPageSize] = useState(pageSizes[1])
  const [requestedPage, setRequestedPage] = useState(0)

  const sorted = useMemo(() => {
    const sortValue = columns.find((c) => c.key === sort.key)?.sortValue
    if (!sortValue) return allRows
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...allRows].sort(
      (a, b) => factor * sortValue(a).localeCompare(sortValue(b)) || getName(a).localeCompare(getName(b)),
    )
  }, [allRows, columns, sort, getName])

  // The page is derived, so filtering or deleting can never leave it out of range.
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const page = Math.min(requestedPage, pageCount - 1)
  const rows = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const from = sorted.length === 0 ? 0 : page * pageSize + 1
  const to = page * pageSize + rows.length

  const selectedOnPage = rows.filter((r) => selected.has(r.id)).length
  const allOnPage = rows.length > 0 && selectedOnPage === rows.length

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (!next.delete(id)) next.add(id)
    onSelectedChange(next)
  }
  const togglePage = () => {
    const next = new Set(selected)
    rows.forEach((r) => (allOnPage ? next.delete(r.id) : next.add(r.id)))
    onSelectedChange(next)
  }
  const sortBy = (key: string) =>
    setSort((s) => ({ key, direction: s.key === key && s.direction === 'asc' ? 'desc' : 'asc' }))

  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const measure = () => setScrollbarWidth(body.offsetWidth - body.clientWidth)
    measure()
    // Fires when the scrollbar appears or disappears, because that changes the content width.
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    return () => observer.disconnect()
  }, [])

  const colGroup = (
    <colgroup>
      <col style={{ width: SELECT_WIDTH }} />
      {columns.map((c) => (
        <col key={c.key} className={c.hideBelow ? hideCol[c.hideBelow] : undefined} style={c.width ? { width: c.width } : undefined} />
      ))}
      <col style={{ width: renderActions ? ACTIONS_WIDTH_WITH_EXTRA : ACTIONS_WIDTH }} />
    </colgroup>
  )

  return (
    <>
      <div className="relative overflow-x-auto">
        <div className={minWidthClass} style={minWidthClass ? undefined : { minWidth }}>
          {/* The header sits outside the scroll area, so the scrollbar only runs alongside the body. */}
          <div className="overflow-hidden border-y border-line" style={{ paddingRight: scrollbarWidth }}>
            <table className={tableClass}>
              {colGroup}
              <thead>
                <tr className="text-[11px] font-medium text-muted">
                  <th scope="col" className="py-2.5 pl-4 pr-0">
                    <Checkbox
                      checked={allOnPage}
                      indeterminate={selectedOnPage > 0 && !allOnPage}
                      onChange={togglePage}
                      aria-label={labels.selectAll}
                    />
                  </th>
                  {columns.map((c) => {
                    if (!c.sortValue) {
                      return (
                        <th key={c.key} scope="col" className={`px-3 py-2.5 font-medium ${c.hideBelow ? hideCell[c.hideBelow] : ''}`}>
                          {c.header}
                        </th>
                      )
                    }
                    const active = sort.key === c.key
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        className={`px-3 py-0 font-medium ${c.hideBelow ? hideCell[c.hideBelow] : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => sortBy(c.key)}
                          className={`-ml-1.5 flex items-center gap-1 rounded px-1.5 py-2 transition-colors hover:text-fg ${focusRing} ${active ? 'text-fg' : ''}`}
                        >
                          {c.header}
                          <span
                            className={`[&>svg]:h-3.5 [&>svg]:w-3.5 ${active ? '' : 'opacity-0'} ${active && sort.direction === 'asc' ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          >
                            <ChevronDownIcon />
                          </span>
                        </button>
                      </th>
                    )
                  })}
                  <th scope="col" className="py-2.5 pl-3 pr-4">
                    <span className="sr-only">{labels.actions}</span>
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          <div ref={bodyRef} className="relative max-h-[38.5rem] overflow-y-auto">
            <table className={tableClass}>
              {colGroup}
              <tbody>
                {rows.map((row) => {
                  const isSelected = selected.has(row.id)
                  const name = getName(row)
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onOpen(row.id)}
                      aria-selected={isSelected}
                      className={`group cursor-pointer border-b border-line/60 transition-colors last:border-b-0 ${isSelected ? 'bg-accent-soft' : 'hover:bg-hover'}`}
                    >
                      <td className="py-3 pl-4 pr-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onChange={() => toggle(row.id)} aria-label={labels.selectRow(name)} />
                      </td>
                      {columns.map((c) =>
                        c.primary ? (
                          <td key={c.key} className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              {showAvatar && <Avatar name={name} />}
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onOpen(row.id)
                                  }}
                                  className={`block max-w-full truncate rounded font-medium hover:underline ${focusRing}`}
                                >
                                  {name}
                                </button>
                                <p className="truncate text-[11px] text-muted">{getSubtitle(row)}</p>
                              </div>
                            </div>
                          </td>
                        ) : (
                          <td key={c.key} className={`px-3 py-3 ${c.cellClassName ?? ''} ${c.hideBelow ? hideCell[c.hideBelow] : ''}`}>
                            {c.cell?.(row)}
                          </td>
                        ),
                      )}
                      <td className="py-3 pl-3 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-0.5 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                          {renderActions?.(row)}
                          <button type="button" onClick={() => onEdit(row.id)} aria-label={`${labels.edit}: ${name}`} className={iconButton}>
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(row.id)}
                            aria-label={`${labels.delete}: ${name}`}
                            className={`${iconButton} hover:text-red-600 dark:hover:text-red-400`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line px-4 py-2 text-xs text-muted">
        <label className="flex items-center gap-2">
          {labels.rowsPerPage}
          <Dropdown
            aria-label={labels.rowsPerPage}
            value={String(pageSize)}
            options={pageSizes.map((n) => ({ value: String(n), label: String(n) }))}
            onChange={(v) => {
              setPageSize(Number(v))
              setRequestedPage(0)
            }}
            className="py-1 text-xs"
            wrapperClassName="w-16"
          />
        </label>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className="mr-3">
            {labels.range(from, to, sorted.length)}
          </span>
          <button
            type="button"
            onClick={() => setRequestedPage(page - 1)}
            disabled={page === 0}
            aria-label={labels.prev}
            className={`${iconButton} rotate-90 p-2 disabled:pointer-events-none disabled:opacity-30`}
          >
            <ChevronDownIcon />
          </button>
          <button
            type="button"
            onClick={() => setRequestedPage(page + 1)}
            disabled={page >= pageCount - 1}
            aria-label={labels.next}
            className={`${iconButton} -rotate-90 p-2 disabled:pointer-events-none disabled:opacity-30`}
          >
            <ChevronDownIcon />
          </button>
        </div>
      </div>
    </>
  )
}
