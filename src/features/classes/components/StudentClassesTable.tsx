import { useMemo } from 'react'
import DataTable from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import type { ClassTeaching } from '@/features/classes/lib/classTeaching'
import type { SchoolClass } from '@/features/classes/types'
import { formatDate } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

interface Props {
  classes: SchoolClass[]
  /** Teachers and subjects per class id. */
  teaching: Record<string, ClassTeaching>
}

const NONE = '—'

/** The student's classes as a read-only table: teacher, class, subject, dates and status. */
export default function StudentClassesTable({ classes, teaching }: Props) {
  const { t, locale } = useI18n()

  const teacherOf = (c: SchoolClass) => teaching[c.id]?.teachers.join(', ') || NONE
  const subjectOf = (c: SchoolClass) => teaching[c.id]?.subjects.join(', ') || NONE

  const columns = useMemo<Column<SchoolClass>[]>(
    () => [
      {
        key: 'teacher',
        header: t('sc.teacherName'),
        width: '12rem',
        sortValue: (c) => teaching[c.id]?.teachers.join(', ') ?? '',
        cellClassName: 'truncate',
        cell: (c) => teacherOf(c),
      },
      { key: 'name', header: t('cls.fieldName'), primary: true, sortValue: (c) => c.name },
      {
        key: 'subject',
        header: t('sub.fieldName'),
        width: '11rem',
        hideBelow: 'lg',
        sortValue: (c) => teaching[c.id]?.subjects.join(', ') ?? '',
        cellClassName: 'truncate text-muted',
        cell: (c) => subjectOf(c),
      },
      {
        key: 'startDate',
        header: t('cls.startDate'),
        width: '9rem',
        sortValue: (c) => c.startDate,
        cellClassName: 'whitespace-nowrap',
        cell: (c) => formatDate(c.startDate, locale),
      },
      {
        key: 'endDate',
        header: t('cls.endDate'),
        width: '9rem',
        sortValue: (c) => c.endDate,
        cellClassName: 'whitespace-nowrap',
        cell: (c) => formatDate(c.endDate, locale),
      },
      {
        key: 'status',
        header: t('cls.status'),
        width: '8rem',
        sortValue: (c) => c.status,
        cell: (c) => <StatusBadge status={c.status} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale, teaching],
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
      rows={classes}
      columns={columns}
      getName={(c) => c.name}
      getSubtitle={(c) => c.description}
      showAvatar={false}
      initialSort="name"
      minWidthClass="min-w-[44rem] lg:min-w-[58rem]"
      labels={labels}
    />
  )
}
