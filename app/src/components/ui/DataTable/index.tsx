import TableBody from './TableBody'
import TableColGroup from './TableColGroup'
import TableHeader from './TableHeader'
import TablePagination from './TablePagination'
import { pageSizes, tableClass } from './constants'
import { useDataTable } from './useDataTable'
import { useRowSelection } from './useRowSelection'
import { useScrollbarWidth } from './useScrollbarWidth'
import type { DataTableProps } from './types'

export type { Column, DataTableProps, TableLabels } from './types'

const NO_SELECTION: ReadonlySet<string> = new Set()
const noop = () => {}

export default function DataTable<T extends { id: string }>({
  rows: allRows,
  columns,
  getName,
  getSubtitle,
  initialSort,
  labels,
  selected = NO_SELECTION,
  onSelectedChange = noop,
  onOpen = noop,
  onEdit = noop,
  onDelete = noop,
  readOnly = false,
  initialPageSize = pageSizes[1],
  emptyMessage,
  minWidth = '64rem',
  minWidthClass,
  showAvatar = true,
  renderActions,
}: DataTableProps<T>) {
  const showActions = !readOnly || Boolean(renderActions)
  const { bodyRef, scrollbarWidth } = useScrollbarWidth()
  const data = useDataTable({ rows: allRows, columns, getName, initialSort, initialPageSize })
  const selection = useRowSelection({ rows: data.rows, selected, onSelectedChange })

  return (
    <>
      <div className="relative overflow-x-auto">
        <div className={minWidthClass} style={minWidthClass ? undefined : { minWidth }}>
          {/* The header sits outside the scroll area, so the scrollbar only runs alongside the body. */}
          <div className="overflow-hidden border-y border-line" style={{ paddingRight: scrollbarWidth }}>
            <table className={tableClass}>
              <TableColGroup columns={columns} readOnly={readOnly} showActions={showActions} hasExtraActions={Boolean(renderActions)} />
              <TableHeader
                columns={columns}
                labels={labels}
                readOnly={readOnly}
                showActions={showActions}
                allOnPage={selection.allOnPage}
                someOnPage={selection.someOnPage}
                onTogglePage={selection.togglePage}
                sortDirection={data.sortDirection}
                sortHandler={data.sortHandler}
              />
            </table>
          </div>

          <TableBody
            rows={data.rows}
            columns={columns}
            labels={labels}
            bodyRef={bodyRef}
            selected={selected}
            readOnly={readOnly}
            showActions={showActions}
            showAvatar={showAvatar}
            emptyMessage={emptyMessage}
            getName={getName}
            getSubtitle={getSubtitle}
            renderActions={renderActions}
            onToggle={selection.toggle}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>

      <TablePagination
        labels={labels}
        page={data.page}
        pageCount={data.pageCount}
        pageSize={data.pageSize}
        from={data.from}
        to={data.to}
        total={data.total}
        onPageChange={data.goToPage}
        onPageSizeChange={data.changePageSize}
      />
    </>
  )
}
