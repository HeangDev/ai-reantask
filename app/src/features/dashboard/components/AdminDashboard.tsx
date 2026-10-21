import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon, ClassIcon, PlusIcon, SubjectIcon, UsersIcon } from '@/shared/components/icons'
import { useProfile } from '@/features/auth'
import { teachingOf } from '@/features/classes'
import { useClasses } from '@/features/classes'
import { greetingKey } from '@/features/dashboard/components/DashboardGreeting'
import { AdminOverviewChart } from '@/features/dashboard/components/AdminOverviewChart'
import { StatLink } from '@/features/dashboard/components/AdminDashboardParts'
import { useSubjects } from '@/features/subjects'
import { useTeachers } from '@/features/teachers'
import { useUsersList } from '@/features/users'
import { useI18n } from '@/shared/i18n'
import { paths } from '@/shared/config/paths'

// Only the `total` of these is used, so a page of one row is enough.
const COUNT_ONLY = { search: '', page: 1, perPage: 1 } as const

/** The admin's dashboard: what needs a decision first (registrations, classes without a teacher), then the totals. */
export function AdminDashboard() {
  const { t, locale } = useI18n()
  const profile = useProfile()
  const teachers = useTeachers()
  const classes = useClasses()
  const subjects = useSubjects()
  const allUsers = useUsersList({ ...COUNT_ONLY, role: '', status: '' })
  const students = useUsersList({ ...COUNT_ONLY, role: 'student', status: '' })
  const pendingUsers = useUsersList({ ...COUNT_ONLY, role: '', status: 'PENDING' })

  const pendingCount = pendingUsers.data?.total ?? 0
  const userTotal = allUsers.data?.total ?? 0
  const studentCount = students.data?.total ?? 0
  // Classes nobody teaches yet; an admin fixes these by giving a teacher the class.
  const unassigned = useMemo(
    () => classes.filter((c) => c.status === 'active' && teachingOf(c, teachers).teachers.length === 0),
    [classes, teachers],
  )

  const now = new Date()
  const today = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const activeClasses = classes.filter((c) => c.status === 'active').length
  const activeSubjects = subjects.filter((s) => s.status === 'active').length
  const needsAttention = pendingCount > 0 || unassigned.length > 0

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{today}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{t(greetingKey(now.getHours()), { name: profile.fullName })}</h1>
          <p
            aria-live="polite"
            className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
              needsAttention
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
            }`}
          >
            {!needsAttention && (
              <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                <CheckIcon />
              </span>
            )}
            {pendingCount > 0
              ? t('adash.pendingSummary', { count: String(pendingCount) })
              : unassigned.length > 0
                ? t('adash.unassignedSummary', { count: String(unassigned.length) })
                : t('adash.allClear')}
          </p>
        </div>
        <Link
          to={paths.users}
          className="flex items-center gap-1.5 rounded-lg bg-accent-strong px-3.5 py-2 text-sm font-medium text-white transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
        >
          <PlusIcon />
          {t('usr.add')}
        </Link>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatLink
          to={paths.users}
          tone="amber"
          highlight={pendingCount > 0}
          label={t('adash.statPending')}
          value={pendingCount}
          detail={t(pendingCount > 0 ? 'adash.pendingDetail' : 'adash.pendingNone')}
          icon={<UsersIcon />}
        />
        <StatLink
          to={paths.users}
          tone="indigo"
          label={t('adash.statUsers')}
          value={allUsers.data?.total ?? 0}
          detail={t('adash.usersDetail', { students: String(students.data?.total ?? 0), teachers: String(teachers.length) })}
          icon={<UsersIcon />}
        />
        <StatLink
          to={paths.classes}
          tone="emerald"
          label={t('tdash.statClasses')}
          value={activeClasses}
          detail={t('tdash.ofTotal', { total: String(classes.length) })}
          icon={<ClassIcon />}
        />
        <StatLink
          to={paths.subjects}
          tone="violet"
          label={t('adash.statSubjects')}
          value={activeSubjects}
          detail={t('adash.ofTotalSubjects', { total: String(subjects.length) })}
          icon={<SubjectIcon />}
        />
      </ul>

      <AdminOverviewChart
        students={studentCount}
        teachers={teachers.length}
        admins={Math.max(0, userTotal - studentCount - teachers.length)}
        splits={[
          { labelKey: 'nav.classes', active: activeClasses, total: classes.length },
          { labelKey: 'nav.subjects', active: activeSubjects, total: subjects.length },
        ]}
      />
    </>
  )
}
