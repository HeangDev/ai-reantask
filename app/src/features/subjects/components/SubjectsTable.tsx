import { useMemo } from 'react'
import type { ReactNode } from 'react'
import DataTable from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Subject } from '@/features/subjects/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** Shown inside the table when it has no rows. */
  emptyMessage?: ReactNode
  /** Already filtered by the page. */
  subjects: Subject[]
  selected: ReadonlySet<string>
  onSelectedChange: (ids: Set<string>) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function SubjectsTable({ subjects, ...handlers }: Props) {
  const { t } = useI18n()

  const columns = useMemo<Column<Subject>[]>(
    () => [
      { key: 'name', header: t('sub.fieldName'), primary: true, sortValue: (s) => s.name },
      {
        key: 'status',
        header: t('cls.status'),
        width: '8rem',
        sortValue: (s) => s.status,
        cell: (s) => <StatusBadge status={s.status} />,
      },
    ],
    [t],
  )

  const labels = useMemo(
    () => ({
      selectAll: t('sub.selectAll'),
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
      rows={subjects}
      columns={columns}
      getName={(s) => s.name}
      getSubtitle={(s) => s.description}
      showAvatar={false}
      initialSort="name"
      minWidthClass="min-w-[36rem] lg:min-w-[42rem]"
      labels={labels}
      {...handlers}
    />
  )
}
