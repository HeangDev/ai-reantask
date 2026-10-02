import { useMemo } from 'react'
import type { ReactNode } from 'react'
import DataTable from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import type { ScoreRow } from '@/features/reports/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  rows: ScoreRow[]
  /** Shown inside the table when it has no rows. */
  emptyMessage?: ReactNode
}

const pad = (n: number) => String(n).padStart(6, '0')

/** Bar and number for a score percentage. The number carries the meaning; the bar only helps the eye. */
function Average({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-muted">—</span>
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </span>
      <span className="font-medium">{percent}%</span>
    </span>
  )
}

export default function ScoreTable({ rows, emptyMessage }: Props) {
  const { t } = useI18n()

  const columns = useMemo<Column<ScoreRow>[]>(
    () => [
      { key: 'student', header: t('stu.colName'), primary: true, sortValue: (r) => r.student },
      {
        key: 'classes',
        header: t('rep.colClasses'),
        width: '13rem',
        hideBelow: 'lg',
        cellClassName: 'truncate text-muted',
        cell: (r) => r.classes.join(', ') || '—',
      },
      {
        key: 'submitted',
        header: t('rep.colSubmitted'),
        width: '8rem',
        sortValue: (r) => pad(r.submitted),
        cell: (r) => `${r.submitted} / ${r.assigned}`,
      },
      {
        key: 'graded',
        header: t('rep.colGraded'),
        width: '6.5rem',
        sortValue: (r) => pad(r.graded),
        cell: (r) => r.graded,
      },
      {
        key: 'score',
        header: t('rep.colScore'),
        width: '8rem',
        sortValue: (r) => pad(r.earned),
        cell: (r) => (r.graded > 0 ? `${r.earned} / ${r.possible}` : '—'),
      },
      {
        key: 'average',
        header: t('rep.colAverage'),
        width: '10rem',
        sortValue: (r) => pad((r.percent ?? -1) + 1),
        cell: (r) => <Average percent={r.percent} />,
      },
    ],
    [t],
  )

  const labels = useMemo(
    () => ({
      selectAll: '',
      selectRow: () => '',
      actions: '',
      edit: '',
      delete: '',
      rowsPerPage: t('stu.rowsPerPage'),
      range: (from: number, to: number, total: number) =>
        t('stu.range', { from: String(from), to: String(to), total: String(total) }),
      prev: t('stu.prev'),
      next: t('stu.next'),
    }),
    [t],
  )

  return (
    <DataTable
      readOnly
      emptyMessage={emptyMessage}
      rows={rows}
      columns={columns}
      getName={(r) => r.student}
      getSubtitle={(r) => r.classes.join(', ')}
      initialSort="student"
      minWidthClass="min-w-[44rem] lg:min-w-[58rem]"
      labels={labels}
    />
  )
}
