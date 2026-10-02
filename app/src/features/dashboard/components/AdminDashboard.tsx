import { useMemo } from 'react'
import Avatar from '@/components/ui/Avatar'
import { CheckIcon, ClassIcon, StudentsIcon, SubjectIcon, TeachersIcon } from '@/components/ui/icons'
import StatusBadge from '@/components/ui/StatusBadge'
import { useProfile } from '@/features/account/store/accountStore'
import { teachingOf } from '@/features/classes/lib/classTeaching'
import { useClasses } from '@/features/classes/store/classesStore'
import DashboardGreeting from '@/features/dashboard/components/DashboardGreeting'
import { Panel } from '@/features/dashboard/components/DashboardPanels'
import { StatCard } from '@/features/dashboard/components/StatCards'
import { sampleStudents } from '@/features/students/data/sampleStudents'
import { useSubjects } from '@/features/subjects/store/subjectsStore'
import { useTeachers } from '@/features/teachers/store/teachersStore'
import { useI18n } from '@/lib/i18n'

const MAX_ROWS = 5

/** The admin's dashboard: how many teachers, subjects, classes and students there are, and what needs a teacher. */
export default function AdminDashboard() {
  const { t } = useI18n()
  const profile = useProfile()
  const teachers = useTeachers()
  const classes = useClasses()
  const subjects = useSubjects()

  // Classes nobody teaches yet; an admin fixes these by giving a teacher the class.
  const unassigned = useMemo(
    () => classes.filter((c) => c.status === 'active' && teachingOf(c, teachers).teachers.length === 0),
    [classes, teachers],
  )

  return (
    <>
      <DashboardGreeting
        name={profile.fullName}
        summary={
          unassigned.length > 0
            ? t('adash.unassignedSummary', { count: String(unassigned.length) })
            : t('adash.allAssigned')
        }
      />

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('adash.statTeachers')}
          value={String(teachers.length)}
          icon={<TeachersIcon />}
          detail={<p>{t('adash.teachersDetail')}</p>}
        />
        <StatCard
          label={t('adash.statSubjects')}
          value={String(subjects.filter((s) => s.status === 'active').length)}
          icon={<SubjectIcon />}
          detail={<p>{t('adash.ofTotalSubjects', { total: String(subjects.length) })}</p>}
        />
        <StatCard
          label={t('tdash.statClasses')}
          value={String(classes.filter((c) => c.status === 'active').length)}
          icon={<ClassIcon />}
          detail={<p>{t('tdash.ofTotal', { total: String(classes.length) })}</p>}
        />
        <StatCard
          label={t('tdash.statStudents')}
          value={String(sampleStudents.length)}
          icon={<StudentsIcon />}
          detail={<p>{t('tdash.studentsDetail')}</p>}
        />
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title={t('nav.teachers')} to="/teachers">
          {teachers.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('tch.emptyTitle')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {teachers.slice(0, MAX_ROWS).map((x) => (
                <li key={x.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={x.fullName} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{x.fullName}</span>
                    <span className="block truncate text-xs text-muted">{x.subject}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{t('tch.classesCount', { count: String(x.classes.length) })}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

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
    </>
  )
}
