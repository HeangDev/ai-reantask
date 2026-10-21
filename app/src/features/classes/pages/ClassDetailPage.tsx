import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AssignForm, useAssignments, useCreateAssignment } from '@/features/assignments'
import { ErrorState } from '@/shared/components/ErrorState'
import { ClassAssignments } from '@/features/classes/components/ClassAssignments'
import { ClassHero } from '@/features/classes/components/ClassHero'
import { ClassRoster } from '@/features/classes/components/ClassRoster'
import { AddStudentsDialog } from '@/features/classes/components/AddStudentsDialog'
import { InviteStudentsDialog } from '@/features/classes/components/InviteStudentsDialog'
import { useClassesQuery } from '@/features/classes/api/useClasses'
import { inScope } from '@/features/classes/hooks/useVisibleClasses'
import { assignmentsOfClass, buildRoster, summarizeClass } from '@/features/classes/lib/classRoster'
import type { RosterRow } from '@/features/classes/lib/classRoster'
import { teachingOf } from '@/features/classes/lib/classTeaching'
import { membersOfClass, useJoinRequests } from '@/features/classes/store/joinRequestsStore'
import { sampleStudents } from '@/features/students'
import { useCurrentTeacher, useTeacherClassScope, useTeachers } from '@/features/teachers'
import { paths } from '@/shared/config/paths'
import { useI18n } from '@/shared/i18n'

type Dialog = { type: 'none' } | { type: 'add' } | { type: 'invite' } | { type: 'assign'; students: string[] }

const NO_DIALOG: Dialog = { type: 'none' }
const emails: ReadonlyMap<string, string> = new Map(sampleStudents.map((s) => [s.id, s.email]))

/**
 * One class as its teacher sees it: what they teach in it, the students in it, the work already set, and a way to
 * set new work for the whole class or for chosen students.
 */
export function ClassDetailPage() {
  const { t } = useI18n()
  const { classId = '' } = useParams()
  const classesQuery = useClassesQuery()
  const scope = useTeacherClassScope()
  const teachers = useTeachers()
  const currentTeacher = useCurrentTeacher()
  const requests = useJoinRequests()
  const everyAssignment = useAssignments()
  const createAssignment = useCreateAssignment()
  const [dialog, setDialog] = useState<Dialog>(NO_DIALOG)

  const schoolClass = useMemo(
    () => inScope(classesQuery.data ?? [], scope).find((c) => c.id === classId) ?? null,
    [classesQuery.data, scope, classId],
  )
  const classAssignments = useMemo(
    () => (schoolClass ? assignmentsOfClass(everyAssignment, schoolClass.name) : []),
    [everyAssignment, schoolClass],
  )
  const roster = useMemo(
    () => (schoolClass ? buildRoster(membersOfClass(requests, schoolClass.id), classAssignments, emails) : []),
    [requests, classAssignments, schoolClass],
  )
  const summary = useMemo(() => summarizeClass(classAssignments), [classAssignments])

  if (classesQuery.isPending) {
    return <p className="p-10 text-center text-sm text-muted">{t('cls.loading')}</p>
  }
  if (classesQuery.isError) {
    return <ErrorState descriptionKey="cls.loadFailed" onRetry={() => void classesQuery.refetch()} />
  }
  if (!schoolClass) {
    return (
      <ErrorState titleKey="cdet.notFoundTitle" descriptionKey="cdet.notFoundDesc">
        <Link
          to={paths.classes}
          className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t('cdet.back')}
        </Link>
      </ErrorState>
    )
  }

  // What this teacher teaches here; failing that, what the class's teachers teach.
  const subject = currentTeacher?.classes.includes(schoolClass.id)
    ? currentTeacher.subject
    : teachingOf(schoolClass, teachers).subjects.join(', ')

  const close = () => setDialog(NO_DIALOG)
  const assign = (rows: RosterRow[]) => setDialog({ type: 'assign', students: rows.map((r) => r.name) })

  return (
    <section className="p-4 sm:p-6">
      <ClassHero
        schoolClass={schoolClass}
        subject={subject}
        studentCount={roster.length}
        summary={summary}
        onAddStudents={() => setDialog({ type: 'add' })}
        onInvite={() => setDialog({ type: 'invite' })}
      />

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ClassRoster rows={roster} onAssign={assign} />
        <ClassAssignments assignments={classAssignments} onCreate={() => setDialog({ type: 'assign', students: roster.map((r) => r.name) })} />
      </div>

      {dialog.type === 'add' && <AddStudentsDialog schoolClass={schoolClass} onClose={close} />}
      {dialog.type === 'invite' && <InviteStudentsDialog schoolClass={schoolClass} onClose={close} />}
      {dialog.type === 'assign' && (
        <AssignForm
          assignment={null}
          lockedClass={schoolClass.name}
          studentNames={roster.map((r) => r.name)}
          presetAssignees={dialog.students}
          onSave={(values) => {
            createAssignment(values)
            close()
          }}
          onClose={close}
        />
      )}
    </section>
  )
}
