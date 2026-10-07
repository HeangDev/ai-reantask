import { useMemo, useState } from 'react'
import { useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { features } from './features'
import type { Column } from './types'

interface Options<T extends { id: string }> {
  rows: T[]
  columns: Column<T>[]
  getName: (row: T) => string
  initialSort: string
  initialPageSize: number
}

/** Sorting and pagination, done by TanStack Table. Returns the rows of the current page. */
export function useDataTable<T extends { id: string }>({ rows: allRows, columns, getName, initialSort, initialPageSize }: Options<T>) {
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [requestedPage, setRequestedPage] = useState(0)

  // Rows with equal sort values keep this order (TanStack falls back to the input order), so sort by name first.
  const byName = useMemo(() => [...allRows].sort((a, b) => getName(a).localeCompare(getName(b))), [allRows, getName])

  const columnDefs = useMemo<ColumnDef<typeof features, T>[]>(
    () =>
      columns.map((c) => ({
        id: c.key,
        accessorFn: c.sortValue ? (row: T) => c.sortValue?.(row) ?? '' : undefined,
        enableSorting: Boolean(c.sortValue),
        sortDescFirst: false,
        sortFn: (a, b, id) => String(a.getValue(id)).localeCompare(String(b.getValue(id))),
      })) as ColumnDef<typeof features, T>[],
    [columns],
  )

  // The page is derived, so filtering or deleting can never leave it out of range.
  const pageCount = Math.max(1, Math.ceil(allRows.length / pageSize))
  const page = Math.min(requestedPage, pageCount - 1)

  const table = useTable({
    features,
    data: byName,
    columns: columnDefs,
    getRowId: (row) => row.id,
    initialState: { sorting: [{ id: initialSort, desc: false }] },
    state: { pagination: { pageIndex: page, pageSize } },
    enableSortingRemoval: false,
    autoResetPageIndex: false,
  })

  const rows = table.getRowModel().rows.map((r) => r.original)

  return {
    rows,
    total: allRows.length,
    page,
    pageCount,
    pageSize,
    from: allRows.length === 0 ? 0 : page * pageSize + 1,
    to: page * pageSize + rows.length,
    goToPage: setRequestedPage,
    changePageSize: (size: number) => {
      setPageSize(size)
      setRequestedPage(0)
    },
    sortDirection: (key: string) => table.getColumn(key)?.getIsSorted() ?? false,
    sortHandler: (key: string) => table.getColumn(key)?.getToggleSortingHandler(),
  }
}
