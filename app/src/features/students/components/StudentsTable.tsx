import { useMemo } from 'react'
import type { ReactNode } from 'react'
import DataTable from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { ageFrom, formatDate } from '@/lib/dates'
import type { Student } from '@/features/students/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** Show who teaches each student. Admins see this; a teacher only sees their own students, so it is left out. */
  showTeacher?: boolean
  /** Shown inside the table when it has no rows. */
  emptyMessage?: ReactNode
  /** Already filtered by the page. */
  students: Student[]
  selected: ReadonlySet<string>
  onSelectedChange: (ids: Set<string>) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function StudentsTable({ students, showTeacher = true, ...handlers }: Props) {
  const { t, locale } = useI18n()

  const columns = useMemo<Column<Student>[]>(
    () => [
      { key: 'fullName', header: t('stu.colName'), primary: true, sortValue: (s) => s.fullName },
      {
        key: 'dateOfBirth',
        header: t('stu.colDob'),
        width: '11.5rem',
        sortValue: (s) => s.dateOfBirth,
        cellClassName: 'whitespace-nowrap',
        cell: (s) => (
          <>
            {formatDate(s.dateOfBirth, locale)}
            <span className="text-muted"> · {t('stu.age', { age: String(ageFrom(s.dateOfBirth)) })}</span>
          </>
        ),
      },
      {
        key: 'sex',
        header: t('stu.colSex'),
        width: '4rem',
        sortValue: (s) => s.sex,
        cell: (s) => t(s.sex === 'male' ? 'stu.sexMale' : 'stu.sexFemale'),
      },
      { key: 'phone', header: t('stu.colPhone'), width: '9.5rem', hideBelow: 'xl', cellClassName: 'whitespace-nowrap text-muted', cell: (s) => s.phone },
      {
        key: 'lastVisit',
        header: t('stu.colLastVisit'),
        width: '8rem',
        hideBelow: 'xl',
        sortValue: (s) => s.lastVisit ?? '',
        cellClassName: 'whitespace-nowrap text-muted',
        cell: (s) => (s.lastVisit ? formatDate(s.lastVisit, locale) : t('stu.noVisit')),
      },
      ...(showTeacher
        ? [
            {
              key: 'teacher',
              header: t('stu.colTeacher'),
              width: '9rem',
              sortValue: (s: Student) => s.teacher,
              cellClassName: 'truncate text-muted',
              cell: (s: Student) => s.teacher,
            },
          ]
        : []),
      {
        key: 'status',
        header: t('cls.status'),
        width: '8rem',
        sortValue: (s) => s.status,
        cell: (s) => <StatusBadge status={s.status} />,
      },
    ],
    [t, locale, showTeacher],
  )

  const labels = useMemo(
    () => ({
      selectAll: t('stu.selectAll'),
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
      rows={students}
      columns={columns}
      getName={(s) => s.fullName}
      getSubtitle={(s) => s.email}
      initialSort="fullName"
      minWidthClass="min-w-[52rem] xl:min-w-[60rem]"
      labels={labels}
      {...handlers}
    />
  )
}
