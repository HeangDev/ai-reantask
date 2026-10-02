import { useMemo } from 'react'
import DataTable from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import type { Teacher } from '@/features/teachers/types'
import { ageFrom, formatDate } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** Already filtered by the page. */
  teachers: Teacher[]
  /** Student count per teacher id. */
  studentCounts: Record<string, number>
  /** Class name per class id. */
  classNames: Record<string, string>
  selected: ReadonlySet<string>
  onSelectedChange: (ids: Set<string>) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function TeachersTable({ teachers, studentCounts, classNames, ...handlers }: Props) {
  const { t, locale } = useI18n()

  const columns = useMemo<Column<Teacher>[]>(
    () => [
      { key: 'fullName', header: t('stu.colName'), primary: true, sortValue: (x) => x.fullName },
      {
        key: 'dateOfBirth',
        header: t('stu.colDob'),
        width: '11.5rem',
        sortValue: (x) => x.dateOfBirth,
        cellClassName: 'whitespace-nowrap',
        cell: (x) => (
          <>
            {formatDate(x.dateOfBirth, locale)}
            <span className="text-muted"> · {t('stu.age', { age: String(ageFrom(x.dateOfBirth)) })}</span>
          </>
        ),
      },
      {
        key: 'sex',
        header: t('stu.colSex'),
        width: '4rem',
        sortValue: (x) => x.sex,
        cell: (x) => t(x.sex === 'male' ? 'stu.sexMale' : 'stu.sexFemale'),
      },
      { key: 'phone', header: t('stu.colPhone'), width: '9.5rem', hideBelow: 'xl', cellClassName: 'whitespace-nowrap text-muted', cell: (x) => x.phone },
      {
        key: 'subject',
        header: t('tch.subject'),
        width: '10rem',
        sortValue: (x) => x.subject,
        cellClassName: 'truncate text-muted',
        cell: (x) => x.subject,
      },
      {
        key: 'classes',
        header: t('tch.classes'),
        width: '11rem',
        hideBelow: 'xl',
        cellClassName: 'truncate text-muted',
        cell: (x) => {
          const names = x.classes.map((id) => classNames[id]).filter(Boolean)
          if (names.length === 0) return '—'
          return <span title={names.join(', ')}>{names.slice(0, 2).join(', ')}{names.length > 2 ? ` +${names.length - 2}` : ''}</span>
        },
      },
      {
        key: 'students',
        header: t('tch.colStudents'),
        width: '6rem',
        sortValue: (x) => String(studentCounts[x.id] ?? 0).padStart(6, '0'),
        cell: (x) => studentCounts[x.id] ?? 0,
      },
    ],
    [t, locale, studentCounts, classNames],
  )

  const labels = useMemo(
    () => ({
      selectAll: t('tch.selectAll'),
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
      rows={teachers}
      columns={columns}
      getName={(x) => x.fullName}
      getSubtitle={(x) => x.email}
      initialSort="fullName"
      minWidthClass="min-w-[53rem] xl:min-w-[73rem]"
      labels={labels}
      {...handlers}
    />
  )
}
