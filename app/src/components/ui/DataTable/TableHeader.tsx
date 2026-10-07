import Checkbox from '@/components/ui/Checkbox'
import { ChevronDownIcon } from '@/components/ui/icons'
import { focusRing, hideCell } from './constants'
import type { Column, TableLabels } from './types'

interface Props<T> {
  columns: Column<T>[]
  labels: TableLabels
  readOnly: boolean
  showActions: boolean
  allOnPage: boolean
  someOnPage: boolean
  onTogglePage: () => void
  sortDirection: (key: string) => false | 'asc' | 'desc'
  sortHandler: (key: string) => ((event: unknown) => void) | undefined
}

export default function TableHeader<T>({
  columns,
  labels,
  readOnly,
  showActions,
  allOnPage,
  someOnPage,
  onTogglePage,
  sortDirection,
  sortHandler,
}: Props<T>) {
  return (
    <thead>
      <tr className="text-[11px] font-medium text-muted">
        {!readOnly && (
          <th scope="col" className="py-2.5 pl-4 pr-0">
            <Checkbox checked={allOnPage} indeterminate={someOnPage} onChange={onTogglePage} aria-label={labels.selectAll} />
          </th>
        )}
        {columns.map((c) => {
          if (!c.sortValue) {
            return (
              <th key={c.key} scope="col" className={`px-3 py-2.5 font-medium ${c.hideBelow ? hideCell[c.hideBelow] : ''}`}>
                {c.header}
              </th>
            )
          }
          const direction = sortDirection(c.key)
          const active = Boolean(direction)
          return (
            <th
              key={c.key}
              scope="col"
              aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
              className={`px-3 py-0 font-medium ${c.hideBelow ? hideCell[c.hideBelow] : ''}`}
            >
              <button
                type="button"
                onClick={sortHandler(c.key)}
                className={`-ml-1.5 flex items-center gap-1 rounded px-1.5 py-2 transition-colors hover:text-fg ${focusRing} ${active ? 'text-fg' : ''}`}
              >
                {c.header}
                <span
                  className={`[&>svg]:h-3.5 [&>svg]:w-3.5 ${active ? '' : 'opacity-0'} ${direction === 'asc' ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  <ChevronDownIcon />
                </span>
              </button>
            </th>
          )
        })}
        {showActions && (
          <th scope="col" className="py-2.5 pl-3 pr-4">
            <span className="sr-only">{labels.actions}</span>
          </th>
        )}
      </tr>
    </thead>
  )
}
