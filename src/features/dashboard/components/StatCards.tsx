import type { ReactNode } from 'react'
import { AssignmentsIcon, CalendarIcon, StarIcon, TasksIcon } from '@/components/ui/icons'
import { statusStyles } from '@/features/assignments/components/StatusBadge'
import type { AssignmentStatus } from '@/features/assignments/types'
import type { DashboardStats } from '@/features/dashboard/types'
import { useI18n } from '@/lib/i18n'

const statusOrder: AssignmentStatus[] = ['graded', 'submitted', 'pending', 'resubmit', 'late']

interface CardProps {
  label: string
  value: string
  icon: ReactNode
  detail: ReactNode
}

function StatCard({ label, value, icon, detail }: CardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="mt-1 text-2xl font-bold">{value}</dd>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-fg">
          {icon}
        </span>
      </div>
      <div className="mt-4 text-xs text-muted">{detail}</div>
    </div>
  )
}

export default function StatCards({ stats }: { stats: DashboardStats }) {
  const { t } = useI18n()
  const { total, todo, dueThisWeek, averageScore, byStatus, overdue, gradedPercents, feedbackCount } = stats

  const statusLabel = (s: AssignmentStatus) => t(`status.${s}` as const)
  const completedPercent = total === 0 ? 0 : Math.round(((total - todo) / total) * 100)
  const best = gradedPercents.length ? Math.max(...gradedPercents) : 0

  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t('dash.total')}
        value={String(total)}
        icon={<AssignmentsIcon />}
        detail={
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {statusOrder.map(
              (s) =>
                byStatus[s] > 0 && (
                  <li key={s} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${statusStyles[s].dot}`} aria-hidden="true" />
                    {statusLabel(s)} <span className="font-medium text-fg">{byStatus[s]}</span>
                  </li>
                ),
            )}
          </ul>
        }
      />

      <StatCard
        label={t('dash.todo')}
        value={String(todo)}
        icon={<TasksIcon />}
        detail={
          <>
            <p className="font-medium text-fg">{t('dash.d.completed', { percent: String(completedPercent) })}</p>
            <p className="mt-0.5">
              {statusLabel('pending')} {byStatus.pending} · {statusLabel('late')} {byStatus.late} ·{' '}
              {statusLabel('resubmit')} {byStatus.resubmit}
            </p>
          </>
        }
      />

      <StatCard
        label={t('dash.dueSoon')}
        value={String(dueThisWeek)}
        icon={<CalendarIcon />}
        detail={
          <>
            <p className="font-medium text-fg">{t('dash.d.next7')}</p>
            <p className={`mt-0.5 ${overdue > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
              {t('dash.d.overdue', { count: String(overdue) })}
            </p>
          </>
        }
      />

      <StatCard
        label={t('dash.avgScore')}
        value={averageScore === null ? '—' : `${averageScore}%`}
        icon={<StarIcon />}
        detail={
          gradedPercents.length ? (
            <>
              <p className="font-medium text-fg">
                {t('dash.d.best', { best: String(best), count: String(gradedPercents.length) })}
              </p>
              <p className="mt-0.5">{t('dash.d.feedback', { count: String(feedbackCount) })}</p>
            </>
          ) : (
            <p>{t('dash.d.noGrades')}</p>
          )
        }
      />
    </dl>
  )
}
