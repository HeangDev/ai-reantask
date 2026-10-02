import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'
import { CheckIcon, ChevronRightIcon, ClassIcon, StudentsIcon, SubjectIcon, TeachersIcon } from '@/components/ui/icons'
import StatusBadge from '@/components/ui/StatusBadge'
import { useProfile } from '@/features/account/store/accountStore'
import { teachingOf } from '@/features/classes/lib/classTeaching'
import { useClasses } from '@/features/classes/store/classesStore'
import { greetingKey } from '@/features/dashboard/components/DashboardGreeting'
import { Panel } from '@/features/dashboard/components/DashboardPanels'
import { sampleStudents } from '@/features/students/data/sampleStudents'
import { useSubjects } from '@/features/subjects/store/subjectsStore'
import { useTeachers } from '@/features/teachers/store/teachersStore'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const MAX_ROWS = 5

const shortcuts: { to: string; labelKey: TranslationKey; icon: ReactNode }[] = [
  { to: '/teachers', labelKey: 'nav.teachers', icon: <TeachersIcon /> },
  { to: '/subjects', labelKey: 'nav.subjects', icon: <SubjectIcon /> },
  { to: '/classes', labelKey: 'nav.classes', icon: <ClassIcon /> },
  { to: '/students', labelKey: 'nav.students', icon: <StudentsIcon /> },
]

// Full class names so Tailwind can see them.
const tones = {
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
}

interface StatLinkProps {
  to: string
  label: string
  value: number
  detail: string
  icon: ReactNode
  tone: keyof typeof tones
}

/** A headline number that links to the page it counts. */
function StatLink({ to, label, value, detail, icon, tone }: StatLinkProps) {
  return (
    <li>
      <Link
        to={to}
        className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl [&>svg]:h-6 [&>svg]:w-6 ${tones[tone]}`}>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-muted">{label}</span>
          <span className="block text-3xl font-bold leading-tight tabular-nums">{value}</span>
          <span className="block truncate text-xs text-muted">{detail}</span>
        </span>
        <span
          className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent-fg [&>svg]:h-4 [&>svg]:w-4"
          aria-hidden="true"
        >
          <ChevronRightIcon />
        </span>
      </Link>
    </li>
  )
}

/** Active (green) against inactive (grey) as one bar, with the counts beside it. */
function SplitBar({ label, active, total }: { label: string; active: number; total: number }) {
  const { t } = useI18n()
  const percent = total === 0 ? 0 : Math.round((active / total) * 100)

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted">
          <span className="font-semibold text-fg">{active}</span> {t('usr.active')} · {total - active} {t('usr.inactive')}
        </span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${active} / ${total}`}
        className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sunken"
      >
        <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

/** The admin's dashboard: how many teachers, subjects, classes and students there are, and what needs a teacher. */
export default function AdminDashboard() {
  const { t, locale } = useI18n()
  const profile = useProfile()
  const teachers = useTeachers()
  const classes = useClasses()
  const subjects = useSubjects()

  // Classes nobody teaches yet; an admin fixes these by giving a teacher the class.
  const unassigned = useMemo(
    () => classes.filter((c) => c.status === 'active' && teachingOf(c, teachers).teachers.length === 0),
    [classes, teachers],
  )

  const busiest = useMemo(
    () => [...teachers].sort((a, b) => b.classes.length - a.classes.length).slice(0, MAX_ROWS),
    [teachers],
  )
  const mostClasses = busiest[0]?.classes.length ?? 0

  const now = new Date()
  const today = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const activeClasses = classes.filter((c) => c.status === 'active').length
  const activeSubjects = subjects.filter((s) => s.status === 'active').length

  return (
    <>
      <header className="relative mb-5 overflow-hidden rounded-2xl bg-linear-to-br from-accent-strong to-violet-600 p-6 text-white sm:p-8">
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <p className="text-sm text-white/70">{today}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{t(greetingKey(now.getHours()), { name: profile.fullName })}</h1>
          <p
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur-sm"
            aria-live="polite"
          >
            {unassigned.length === 0 && (
              <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                <CheckIcon />
              </span>
            )}
            {unassigned.length > 0
              ? t('adash.unassignedSummary', { count: String(unassigned.length) })
              : t('adash.allAssigned')}
          </p>

          <nav aria-label={t('adash.overview')} className="mt-6 flex flex-wrap gap-2">
            {shortcuts.map(({ to, labelKey, icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white [&>span>svg]:h-4 [&>span>svg]:w-4"
              >
                <span aria-hidden="true">{icon}</span>
                {t(labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatLink
          to="/teachers"
          tone="indigo"
          label={t('adash.statTeachers')}
          value={teachers.length}
          detail={t('adash.teachersDetail')}
          icon={<TeachersIcon />}
        />
        <StatLink
          to="/subjects"
          tone="violet"
          label={t('adash.statSubjects')}
          value={activeSubjects}
          detail={t('adash.ofTotalSubjects', { total: String(subjects.length) })}
          icon={<SubjectIcon />}
        />
        <StatLink
          to="/classes"
          tone="emerald"
          label={t('tdash.statClasses')}
          value={activeClasses}
          detail={t('tdash.ofTotal', { total: String(classes.length) })}
          icon={<ClassIcon />}
        />
        <StatLink
          to="/students"
          tone="amber"
          label={t('tdash.statStudents')}
          value={sampleStudents.length}
          detail={t('tdash.studentsDetail')}
          icon={<StudentsIcon />}
        />
      </ul>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title={t('adash.workload')} to="/teachers">
            {busiest.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">{t('tch.emptyTitle')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {busiest.map((x) => (
                  <li key={x.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={x.fullName} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">{x.fullName}</span>
                        <span className="shrink-0 text-xs text-muted">
                          {t('tch.classesCount', { count: String(x.classes.length) })}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted">{x.subject}</span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
                        <span
                          className="block h-full rounded-full bg-accent-strong"
                          style={{ width: `${mostClasses === 0 ? 0 : (x.classes.length / mostClasses) * 100}%` }}
                        />
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-line bg-surface">
            <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">{t('adash.overview')}</h2>
            <div className="space-y-4 p-4">
              <SplitBar label={t('nav.classes')} active={activeClasses} total={classes.length} />
              <SplitBar label={t('nav.subjects')} active={activeSubjects} total={subjects.length} />
            </div>
          </section>

          <Panel title={t('adash.needsTeacher')} to="/classes">
            {unassigned.length === 0 ? (
              <p className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 [&>svg]:h-4 [&>svg]:w-4">
                  <CheckIcon />
                </span>
                {t('adash.allAssigned')}
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {unassigned.slice(0, MAX_ROWS).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.name}</span>
                      <span className="block truncate text-xs text-muted">{c.description}</span>
                    </span>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
