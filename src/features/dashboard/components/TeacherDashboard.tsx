import { Link } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'
import { AssignmentsIcon, CheckIcon, ClassIcon, StudentsIcon, TasksIcon } from '@/components/ui/icons'
import NotificationIcon from '@/components/ui/NotificationIcon'
import StatusBadge from '@/components/ui/StatusBadge'
import { useNotifications } from '@/components/ui/Toast'
import { formatDate as formatShortDate } from '@/features/assignments/lib/dates'
import { useProfile } from '@/features/account/store/accountStore'
import AssignmentProgressChart from '@/features/dashboard/components/AssignmentProgressChart'
import DashboardGreeting from '@/features/dashboard/components/DashboardGreeting'
import { Panel } from '@/features/dashboard/components/DashboardPanels'
import { StatCard } from '@/features/dashboard/components/StatCards'
import { useTeacherDashboard } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useI18n } from '@/lib/i18n'
import { formatTimeAgo } from '@/lib/timeAgo'

const MAX_ROWS = 5

const emptyClass = 'p-6 text-center text-sm text-muted'

/** The teacher's dashboard: what needs reviewing, how the assignments are going, and the classes at a glance. */
export default function TeacherDashboard() {
  const { t, locale } = useI18n()
  const profile = useProfile()
  const { stats, phases: phaseCounts, progressByClass, reviews, classes } = useTeacherDashboard()
  const { notifications } = useNotifications()

  return (
    <>
      <DashboardGreeting
        name={profile.fullName}
        summary={
          stats.awaitingReview > 0
            ? t('tdash.reviewWaiting', { count: String(stats.awaitingReview) })
            : t('tdash.allReviewed')
        }
      />

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('tdash.statClasses')}
          value={String(stats.activeClasses)}
          icon={<ClassIcon />}
          detail={<p>{t('tdash.ofTotal', { total: String(stats.totalClasses) })}</p>}
        />
        <StatCard
          label={t('tdash.statStudents')}
          value={String(stats.students)}
          icon={<StudentsIcon />}
          detail={<p>{t('tdash.studentsDetail')}</p>}
        />
        <StatCard
          label={t('tdash.statAssignments')}
          value={String(stats.assignments)}
          icon={<AssignmentsIcon />}
          detail={<p>{t('tdash.dueThisWeek', { count: String(stats.dueThisWeek) })}</p>}
        />
        <StatCard
          label={t('tdash.statReview')}
          value={String(stats.awaitingReview)}
          icon={<TasksIcon />}
          detail={<p>{t('tdash.reviewDetail')}</p>}
        />
      </dl>

      <AssignmentProgressChart totals={phaseCounts} rows={progressByClass} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title={t('tdash.needsReview')} to="/assign">
          {reviews.length === 0 ? (
            <p className={`${emptyClass} flex flex-col items-center gap-2`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 [&>svg]:h-4 [&>svg]:w-4">
                <CheckIcon />
              </span>
              {t('tdash.allReviewed')}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {reviews.slice(0, MAX_ROWS).map((r) => (
                <li key={`${r.assignmentId}-${r.student}`}>
                  <Link
                    to={`/assign/${r.assignmentId}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  >
                    <Avatar name={r.student} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.student}</span>
                      <span className="block truncate text-xs text-muted">
                        {r.assignmentTitle} · {r.className}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">{formatShortDate(r.submittedAt, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('nav.classes')} to="/classes">
          {classes.length === 0 ? (
            <p className={emptyClass}>{t('cls.emptyTitle')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {classes.slice(0, MAX_ROWS).map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {t('cls.statStudents')} {c.students} · {t('cls.statAssignments')} {c.assignments}
                    </span>
                  </span>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('tdash.recentActivity')} to="/notifications">
          {notifications.length === 0 ? (
            <p className={emptyClass}>{t('notif.emptyTitle')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {notifications.slice(0, MAX_ROWS - 1).map((n) => (
                <li key={n.id} className="flex items-center gap-3 px-4 py-2.5">
                  <NotificationIcon variant={n.variant} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{n.title}</span>
                    <span className="block truncate text-xs text-muted">{n.subtitle}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{formatTimeAgo(n.createdAt, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
