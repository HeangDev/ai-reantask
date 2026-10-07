import { ACTIONS_WIDTH, ACTIONS_WIDTH_WITH_EXTRA, SELECT_WIDTH, hideCol } from './constants'
import type { Column } from './types'

interface Props<T> {
  columns: Column<T>[]
  readOnly: boolean
  showActions: boolean
  /** The rows have extra action buttons besides Edit and Delete. */
  hasExtraActions: boolean
}

export default function TableColGroup<T>({ columns, readOnly, showActions, hasExtraActions }: Props<T>) {
  const actionsWidth = hasExtraActions && !readOnly ? ACTIONS_WIDTH_WITH_EXTRA : ACTIONS_WIDTH
  return (
    <colgroup>
      {!readOnly && <col style={{ width: SELECT_WIDTH }} />}
      {columns.map((c) => (
        <col key={c.key} className={c.hideBelow ? hideCol[c.hideBelow] : undefined} style={c.width ? { width: c.width } : undefined} />
      ))}
      {showActions && <col style={{ width: actionsWidth }} />}
    </colgroup>
  )
}
