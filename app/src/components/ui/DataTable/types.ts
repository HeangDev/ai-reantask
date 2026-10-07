import type { ReactNode } from 'react'

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

export interface DataTableProps<T extends { id: string }> {
  /** Already filtered by the page. */
  rows: T[]
  columns: Column<T>[]
  getName: (row: T) => string
  getSubtitle: (row: T) => string
  /** Key of the column the table is sorted by at first. */
  initialSort: string
  labels: TableLabels
  selected?: ReadonlySet<string>
  onSelectedChange?: (ids: Set<string>) => void
  onOpen?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  /** A plain list: no selection boxes, no row actions, and rows do not open. */
  readOnly?: boolean
  /** Rows per page to start with; defaults to 10. */
  initialPageSize?: number
  /** Shown inside the table, between the header and the pagination, when there are no rows. */
  emptyMessage?: ReactNode
  /** Below this width the table scrolls sideways. */
  minWidth?: string
  /** Same, as classes, for tables whose minimum changes with the window (columns that hide on small screens). Wins over minWidth. */
  minWidthClass?: string
  /** Show an initials avatar in the primary column. */
  showAvatar?: boolean
  /** Extra buttons shown before Edit and Delete in each row. */
  renderActions?: (row: T) => ReactNode
}
