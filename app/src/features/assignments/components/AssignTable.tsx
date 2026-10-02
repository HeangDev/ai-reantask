import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AvatarGroup from '@/components/ui/AvatarGroup'
import { EyeIcon } from '@/components/ui/icons'
import DataTable from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import PhaseBadge, { phases } from '@/features/assignments/components/PhaseBadge'
import type { Assignment } from '@/features/assignments/types'
import { formatDate } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** Shown inside the table when it has no rows. */
  emptyMessage?: ReactNode
  /** Already filtered by the page. */
  assignments: Assignment[]
  selected: ReadonlySet<string>
  onSelectedChange: (ids: Set<string>) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function AssignTable({ assignments, ...handlers }: Props) {
  const { t, locale } = useI18n()

  const columns = useMemo<Column<Assignment>[]>(
    () => [
      { key: 'title', header: t('asg.colTitle'), primary: true, sortValue: (a) => a.title },
      {
        key: 'phase',
        header: t('asg.colStatus'),
        width: '9.5rem',
        sortValue: (a) => String(phases.findIndex((p) => p.value === (a.phase ?? 'in-progress'))),
        cell: (a) => <PhaseBadge phase={a.phase ?? 'in-progress'} />,
      },
      {
        key: 'maxScore',
        header: t('asg.colScore'),
        width: '7rem',
        sortValue: (a) => String(a.maxScore).padStart(6, '0'),
        cell: (a) => a.maxScore,
      },
      {
        key: 'assignees',
        header: t('asg.colAssigned'),
        width: '9rem',
        cell: (a) =>
          a.assignees && a.assignees.length > 0 ? (
            <AvatarGroup names={a.assignees} label={a.assignees.join(', ')} />
          ) : (
            <span className="text-muted">—</span>
          ),
      },
      {
        key: 'tasks',
        header: t('asg.colTasks'),
        width: '6rem',
        hideBelow: 'xl',
        sortValue: (a) => String(a.tasks?.length ?? 0).padStart(4, '0'),
        cellClassName: 'text-muted',
        cell: (a) => a.tasks?.length ?? 0,
      },
      {
        key: 'deadline',
        header: t('asg.colDeadline'),
        width: '9.5rem',
        sortValue: (a) => a.deadline,
        cellClassName: 'whitespace-nowrap',
        cell: (a) => formatDate(a.deadline, locale),
      },
    ],
    [t, locale],
  )

  const labels = useMemo(
    () => ({
      selectAll: t('asg.selectAllRows'),
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
      rows={assignments}
      columns={columns}
      getName={(a) => a.title}
      getSubtitle={(a) => a.className}
      initialSort="deadline"
      labels={labels}
      showAvatar={false}
      renderActions={(a) => (
        <Link
          to={`/assign/${a.id}/code`}
          aria-label={`${t('asg.view')}: ${a.title}`}
          title={t('asg.view')}
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
        >
          <EyeIcon />
        </Link>
      )}
      minWidthClass="min-w-[48rem] xl:min-w-[56rem]"
      {...handlers}
    />
  )
}
