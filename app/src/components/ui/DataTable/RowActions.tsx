import type { ReactNode } from 'react'
import { EditIcon, TrashIcon } from '@/components/ui/icons'
import { iconButton } from './constants'
import type { TableLabels } from './types'

interface Props {
  name: string
  labels: TableLabels
  readOnly: boolean
  /** Extra buttons shown before Edit and Delete. */
  extra?: ReactNode
  onEdit: () => void
  onDelete: () => void
}

export default function RowActions({ name, labels, readOnly, extra, onEdit, onDelete }: Props) {
  return (
    <td className="py-3 pl-3 pr-4" onClick={(e) => e.stopPropagation()}>
      <div className={`flex justify-end gap-0.5 transition-opacity ${readOnly ? '' : 'md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100'}`}>
        {extra}
        {!readOnly && (
          <>
            <button type="button" onClick={onEdit} aria-label={`${labels.edit}: ${name}`} className={iconButton}>
              <EditIcon />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`${labels.delete}: ${name}`}
              className={`${iconButton} hover:text-red-600 dark:hover:text-red-400`}
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>
    </td>
  )
}
