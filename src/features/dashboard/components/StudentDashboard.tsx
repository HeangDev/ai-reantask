import { Link } from 'react-router-dom'
import StatusBadge from '@/components/ui/StatusBadge'
import DueLabel from '@/features/assignments/components/DueLabel'
import type { Assignment } from '@/features/assignments/types'
import { teachingOf } from '@/features/classes/lib/classTeaching'
import { useClasses } from '@/features/classes/store/classesStore'
import { useJoinedClassIds } from '@/features/classes/store/joinRequestsStore'
import DashboardGreeting from '@/features/dashboard/components/DashboardGreeting'
import { Panel, Row } from '@/features/dashboard/components/DashboardPanels'
import StatCards from '@/features/dashboard/components/StatCards'
import type { DashboardData } from '@/features/dashboard/types'
import { useTeachers } from '@/features/teachers/store/teachersStore'
import { formatDate } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

const MAX_CLASSES = 4

/** Highlights the one thing the student should do next. */
function NextDeadline({ assignment }: { assignment: Assignment | undefined }) {
  const { t } = useI18n()

  return (
    <section
      aria-labelledby="next-deadline"
      className="relative overflow-hidden rounded-xl bg-linear-to-br from-accent-strong to-violet-600 p-5 text-white"
    >
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 id="next-deadline" className="text-xs font-semibold uppercase tracking-wide text-white/80">
            {t('dash.nextDeadline')}
          </h2>
          {assignment ? (
            <>
              <p className="mt-1 truncate text-xl font-semibold">{assignment.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
                {assignment.className}
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium">
                  <DueLabel deadline={assignment.deadline} />
                </span>
              </p>
            </>
          ) : (
            <p className="mt-1 text-lg font-semibold">{t('dash.nothingDue')}</p>
          )}
        </div>
        {assignment && (
          <Link
            to={`/assignments?q=${encodeURIComponent(assignment.title)}`}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-accent-strong shadow-sm transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t('dash.openAssignment')}
          </Link>
        )}
      </div>
    </section>
  )
}

/** The classes the student joined: class, teacher, dates and status. */
function MyClassesPanel() {
  const { t, locale } = useI18n()
  const classes = useClasses()
  const teachers = useTeachers()
  const joined = useJoinedClassIds()
  const mine = classes.filter((c) => joined.has(c.id)).slice(0, MAX_CLASSES)

  return (
    <Panel title={t('nav.myClasses')} to="/my-classes">
      {mine.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted">{t('sc.emptyTitle')}</p>
      ) : (
        <ul className="divide-y divide-line">
          {mine.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{c.name}</span>
                <span className="block truncate text-xs text-muted">
                  {teachingOf(c, teachers).teachers.join(', ') || '—'} · {formatDate(c.startDate, locale)} –{' '}
                  {formatDate(c.endDate, locale)}
                </span>
              </span>
              <StatusBadge status={c.status} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

/** The student's dashboard: a greeting, what is due next, grades at a glance, and their classes. */
export default function StudentDashboard({ data, name, attention }: { data: DashboardData; name: string; attention: number }) {
  const { t } = useI18n()
  const { stats, upcoming, recent } = data

  const activityText = (a: Assignment) =>
    a.status === 'graded' && a.score !== undefined
      ? t('dash.activity.graded', { score: String(a.score), max: String(a.maxScore) })
      : t('dash.activity.submitted', { file: a.submittedFile ?? '' })

  return (
    <>
      <DashboardGreeting name={name} summary={attention > 0 ? t('page.attention', { count: String(attention) }) : t('page.caughtUp')} />

      <NextDeadline assignment={upcoming[0]} />

      <div className="mt-4">
        <StatCards stats={stats} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title={t('dash.upcoming')}>
          {upcoming.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('dash.noUpcoming')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((a) => (
                <Row key={a.id} assignment={a} trailing={<DueLabel deadline={a.deadline} className="font-medium" />} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('dash.recent')}>
          {recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('dash.noActivity')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((a) => (
                <Row key={a.id} assignment={a} trailing={<span className="text-muted">{activityText(a)}</span>} />
              ))}
            </ul>
          )}
        </Panel>

        <MyClassesPanel />
      </div>
    </>
  )
}
