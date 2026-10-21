import { Link } from 'react-router-dom'
import { AssignmentsIcon, CheckIcon, ClassIcon, PlusIcon, StudentsIcon, TasksIcon } from '@/shared/components/icons'
import { useProfile } from '@/features/auth'
import { StatLink } from '@/features/dashboard/components/AdminDashboardParts'
import { AssignmentProgressChart } from '@/features/dashboard/components/AssignmentProgressChart'
import { greetingKey } from '@/features/dashboard/components/DashboardGreeting'
import { RecentActivity } from '@/features/dashboard/components/RecentActivity'
import { ReviewQueue } from '@/features/dashboard/components/ReviewQueue'
import { TeacherClassTile } from '@/features/dashboard/components/TeacherClassTile'
import { UpcomingDeadlines } from '@/features/dashboard/components/UpcomingDeadlines'
import { useTeacherDashboard } from '@/features/dashboard/hooks/useTeacherDashboard'
import { useI18n } from '@/shared/i18n'
import { paths } from '@/shared/config/paths'

const MAX_CLASSES = 6

const linkClass =
  'rounded text-sm font-medium text-accent-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * The teacher's dashboard, in the order they work: what needs attention, their classes, then the review and
 * deadline lists, with how the assignments are going and the latest activity at the bottom.
 */
export function TeacherDashboard() {
  const { t, locale } = useI18n()
  const profile = useProfile()
  const { stats, phases, progressByClass, reviews, classes, upcoming } = useTeacherDashboard()

  const now = new Date()
  const today = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const waiting = stats.awaitingReview > 0

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{today}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{t(greetingKey(now.getHours()), { name: profile.fullName })}</h1>
          <p
            aria-live="polite"
            className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
              waiting
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
            }`}
          >
            {!waiting && (
              <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                <CheckIcon />
              </span>
            )}
            {waiting ? t('tdash.reviewWaiting', { count: String(stats.awaitingReview) }) : t('tdash.allReviewed')}
          </p>
        </div>
        <Link
          to={paths.assign}
          className="flex items-center gap-1.5 rounded-lg bg-accent-strong px-3.5 py-2 text-sm font-medium text-white transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
        >
          <PlusIcon />
          {t('asg.add')}
        </Link>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatLink
          to={paths.assign}
          tone="amber"
          highlight={waiting}
          label={t('tdash.statReview')}
          value={stats.awaitingReview}
          detail={t('tdash.reviewDetail')}
          icon={<TasksIcon />}
        />
        <StatLink
          to={paths.assign}
          tone="violet"
          label={t('tdash.statAssignments')}
          value={stats.assignments}
          detail={t('tdash.dueThisWeek', { count: String(stats.dueThisWeek) })}
          icon={<AssignmentsIcon />}
        />
        <StatLink
          to={paths.classes}
          tone="emerald"
          label={t('tdash.statClasses')}
          value={stats.activeClasses}
          detail={t('tdash.ofTotal', { total: String(stats.totalClasses) })}
          icon={<ClassIcon />}
        />
        <StatLink
          to={paths.classes}
          tone="indigo"
          label={t('tdash.statStudents')}
          value={stats.students}
          detail={t('tdash.studentsDetail')}
          icon={<StudentsIcon />}
        />
      </ul>

      <section className="mt-6" aria-labelledby="my-classes-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="my-classes-title" className="text-base font-semibold">
            {t('tdash.myClasses')}
          </h2>
          <Link to={paths.classes} className={linkClass}>
            {t('dash.viewAll')}
          </Link>
        </div>
        {classes.length === 0 ? (
          <p className="rounded-xl border border-line p-8 text-center text-sm text-muted">{t('tcls.emptyTitle')}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {classes.slice(0, MAX_CLASSES).map((c) => (
              <TeacherClassTile key={c.id} c={c} />
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ReviewQueue reviews={reviews} />
        <UpcomingDeadlines items={upcoming} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <AssignmentProgressChart totals={phases} rows={progressByClass} />
        <RecentActivity />
      </div>
    </>
  )
}
