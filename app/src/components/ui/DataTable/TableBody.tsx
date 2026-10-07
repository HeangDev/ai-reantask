import type { ReactNode, RefObject } from 'react'
import Checkbox from '@/components/ui/Checkbox'
import { hideCell, tableClass } from './constants'
import PrimaryCell from './PrimaryCell'
import RowActions from './RowActions'
import TableColGroup from './TableColGroup'
import type { Column, TableLabels } from './types'

interface Props<T extends { id: string }> {
  /** Rows on the current page. */
  rows: T[]
  columns: Column<T>[]
  labels: TableLabels
  bodyRef: RefObject<HTMLDivElement | null>
  selected: ReadonlySet<string>
  readOnly: boolean
  showActions: boolean
  showAvatar: boolean
  emptyMessage?: ReactNode
  getName: (row: T) => string
  getSubtitle: (row: T) => string
  renderActions?: (row: T) => ReactNode
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function TableBody<T extends { id: string }>({
  rows,
  columns,
  labels,
  bodyRef,
  selected,
  readOnly,
  showActions,
  showAvatar,
  emptyMessage,
  getName,
  getSubtitle,
  renderActions,
  onToggle,
  onOpen,
  onEdit,
  onDelete,
}: Props<T>) {
  return (
    <div ref={bodyRef} className="relative max-h-[38.5rem] overflow-y-auto">
      <table className={tableClass}>
        <TableColGroup columns={columns} readOnly={readOnly} showActions={showActions} hasExtraActions={Boolean(renderActions)} />
        <tbody>
          {rows.map((row) => {
            const isSelected = selected.has(row.id)
            const name = getName(row)
            return (
              <tr
                key={row.id}
                onClick={readOnly ? undefined : () => onOpen(row.id)}
                aria-selected={isSelected}
                className={`group ${readOnly ? '' : 'cursor-pointer'} border-b border-line/60 transition-colors last:border-b-0 ${isSelected ? 'bg-accent-soft' : 'hover:bg-hover'}`}
              >
                {!readOnly && (
                  <td className="py-3 pl-4 pr-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onChange={() => onToggle(row.id)} aria-label={labels.selectRow(name)} />
                  </td>
                )}
                {columns.map((c) =>
                  c.primary ? (
                    <PrimaryCell
                      key={c.key}
                      name={name}
                      subtitle={getSubtitle(row)}
                      showAvatar={showAvatar}
                      readOnly={readOnly}
                      onOpen={() => onOpen(row.id)}
                    />
                  ) : (
                    <td key={c.key} className={`px-3 py-3 ${c.cellClassName ?? ''} ${c.hideBelow ? hideCell[c.hideBelow] : ''}`}>
                      {c.cell?.(row)}
                    </td>
                  ),
                )}
                {showActions && (
                  <RowActions
                    name={name}
                    labels={labels}
                    readOnly={readOnly}
                    extra={renderActions?.(row)}
                    onEdit={() => onEdit(row.id)}
                    onDelete={() => onDelete(row.id)}
                  />
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && emptyMessage && (
        <div role="status" className="px-4 py-12 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      )}
    </div>
  )
}
