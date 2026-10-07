import Dropdown from '@/components/ui/Dropdown'
import { ChevronDownIcon } from '@/components/ui/icons'
import { iconButton, pageSizes } from './constants'
import type { TableLabels } from './types'

interface Props {
  labels: TableLabels
  page: number
  pageCount: number
  pageSize: number
  from: number
  to: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export default function TablePagination({ labels, page, pageCount, pageSize, from, to, total, onPageChange, onPageSizeChange }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line px-4 py-2 text-xs text-muted">
      <label className="flex items-center gap-2">
        {labels.rowsPerPage}
        <Dropdown
          aria-label={labels.rowsPerPage}
          value={String(pageSize)}
          options={pageSizes.map((n) => ({ value: String(n), label: String(n) }))}
          onChange={(v) => onPageSizeChange(Number(v))}
          className="py-1 text-xs"
          wrapperClassName="w-16"
        />
      </label>
      <div className="flex items-center gap-2">
        <span aria-live="polite" className="mr-3">
          {labels.range(from, to, total)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label={labels.prev}
          className={`${iconButton} rotate-90 p-2 disabled:pointer-events-none disabled:opacity-30`}
        >
          <ChevronDownIcon />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label={labels.next}
          className={`${iconButton} -rotate-90 p-2 disabled:pointer-events-none disabled:opacity-30`}
        >
          <ChevronDownIcon />
        </button>
      </div>
    </div>
  )
}
