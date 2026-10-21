import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/shared/components/DataTable'
import type { Column } from '@/shared/components/DataTable'
import { ChevronRightIcon, MailIcon } from '@/shared/components/icons'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { ClassOverview } from '@/features/classes/hooks/useClassOverview'
import type { SchoolClass } from '@/features/classes/types'
import { paths } from '@/shared/config/paths'
import { useI18n } from '@/shared/i18n'

interface Props {
  /** Shown inside the table when it has no rows. */
  emptyMessage?: ReactNode
  /** Already filtered by the page. */
  classes: SchoolClass[]
  overviews: Record<string, ClassOverview>
  onInvite: (id: string) => void
}

const pad = (n: number) => String(n).padStart(6, '0')

/** A read-only list of the teacher's classes: name, subject and total students. */
export function TeacherClassesTable({ classes, overviews, emptyMessage, onInvite }: Props) {
  const { t } = useI18n()

  const columns = useMemo<Column<SchoolClass>[]>(
    () => [
      { key: 'name', header: t('cls.fieldName'), primary: true, sortValue: (c) => c.name },
      {
        key: 'subject',
        header: t('tch.subject'),
        width: '12rem',
        sortValue: (c) => overviews[c.id]?.subject ?? '',
        cellClassName: 'truncate text-muted',
        cell: (c) => overviews[c.id]?.subject || '—',
      },
      {
        key: 'students',
        header: t('cls.totalStudents'),
        width: '9rem',
        sortValue: (c) => pad(overviews[c.id]?.totalStudents ?? 0),
        cell: (c) => overviews[c.id]?.totalStudents ?? 0,
      },
      {
        key: 'status',
        header: t('cls.status'),
        width: '8rem',
        sortValue: (c) => c.status,
        cell: (c) => <StatusBadge status={c.status} />,
      },
    ],
    [t, overviews],
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
      readOnly
      rows={classes}
      columns={columns}
      getName={(c) => c.name}
      getSubtitle={(c) => c.description}
      showAvatar={false}
      initialSort="name"
      minWidth="42rem"
      labels={labels}
      emptyMessage={emptyMessage}
      renderActions={(c) => (
        <>
          <Link
            to={paths.classDetail(c.id)}
            aria-label={`${t('cdet.open')}: ${c.name}`}
            title={t('cdet.open')}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
          >
            <ChevronRightIcon />
          </Link>
          <button
            type="button"
            onClick={() => onInvite(c.id)}
            aria-label={`${t('cls.invite')}: ${c.name}`}
            title={t('cls.invite')}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
          >
            <MailIcon />
          </button>
        </>
      )}
    />
  )
}
