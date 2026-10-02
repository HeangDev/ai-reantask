import { useMemo } from 'react'
import DataTable from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CopyCodeButton from '@/features/classes/components/CopyCodeButton'
import type { SchoolClass } from '@/features/classes/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** Already filtered by the page. */
  classes: SchoolClass[]
  /** Student and assignment counts per class id. */
  stats: Record<string, { students: number; assignments: number }>
  selected: ReadonlySet<string>
  onSelectedChange: (ids: Set<string>) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const pad = (n: number) => String(n).padStart(6, '0')

export default function ClassesTable({ classes, stats, ...handlers }: Props) {
  const { t } = useI18n()

  const columns = useMemo<Column<SchoolClass>[]>(
    () => [
      { key: 'name', header: t('cls.fieldName'), primary: true, sortValue: (c) => c.name },
      {
        key: 'students',
        header: t('cls.statStudents'),
        width: '6.5rem',
        sortValue: (c) => pad(stats[c.id]?.students ?? 0),
        cell: (c) => stats[c.id]?.students ?? 0,
      },
      {
        key: 'assignments',
        header: t('cls.statAssignments'),
        width: '8rem',
        hideBelow: 'lg',
        sortValue: (c) => pad(stats[c.id]?.assignments ?? 0),
        cell: (c) => stats[c.id]?.assignments ?? 0,
      },
      {
        key: 'code',
        header: t('cls.code'),
        width: '12rem',
        cell: (c) => (
          <span className="flex items-center gap-2">
            <span className="font-mono font-semibold tracking-widest">{c.code}</span>
            <CopyCodeButton code={c.code} className="px-2 py-0.5" />
          </span>
        ),
      },
      {
        key: 'status',
        header: t('cls.status'),
        width: '8rem',
        sortValue: (c) => c.status,
        cell: (c) => <StatusBadge status={c.status} />,
      },
    ],
    [t, stats],
  )

  const labels = useMemo(
    () => ({
      selectAll: t('cls.selectAll'),
      selectRow: (name: string) => t('stu.selectRow', { name }),
      actions: t('stu.colActions'),
      edit: t('stu.edit'),
      delete: t('stu.delete'),
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
      rows={classes}
      columns={columns}
      getName={(c) => c.name}
      getSubtitle={(c) => c.description}
      showAvatar={false}
      initialSort="name"
      minWidthClass="min-w-[46rem] lg:min-w-[52rem]"
      labels={labels}
      {...handlers}
    />
  )
}
