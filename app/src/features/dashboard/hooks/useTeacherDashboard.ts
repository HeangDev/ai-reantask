import { useMemo } from 'react'
import { daysUntil } from '@/features/assignments/lib/dates'
import { useAssignments } from '@/features/assignments/store/assignmentsStore'
import type { AssignmentPhase } from '@/features/assignments/types'
import { sampleStudents } from '@/features/students/data/sampleStudents'
import { useOwnStudentFilter } from '@/features/students/hooks/useOwnStudents'
import { useClassNameScope, useVisibleClasses } from '@/features/classes/hooks/useVisibleClasses'
import { membersOfClass, useJoinRequests } from '@/features/classes/store/joinRequestsStore'
import type { ProgressRow, TeacherDashboardData } from '@/features/dashboard/types'

/**
 * The teacher's numbers, worked out from the assignments, classes and students rather than stored, so they can
 * never drift out of date. Placeholder data until the APIs are documented in docs/api.md.
 */
export function useTeacherDashboard(): TeacherDashboardData {
  const everyAssignment = useAssignments()
  const classes = useVisibleClasses()
  const requests = useJoinRequests()
  const names = useClassNameScope()
  const isOwn = useOwnStudentFilter()
  // Only the assignments of the classes this teacher teaches.
  const assignments = useMemo(() => (names ? everyAssignment.filter((a) => names.has(a.className)) : everyAssignment), [everyAssignment, names])

  return useMemo(() => {
    const phases: Record<AssignmentPhase, number> = { 'in-progress': 0, 'in-review': 0, completed: 0 }
    assignments.forEach((a) => (phases[a.phase ?? 'in-progress'] += 1))

    const byClass = new Map<string, ProgressRow>()
    assignments.forEach((a) => {
      const row = byClass.get(a.className) ?? {
        className: a.className,
        counts: { 'in-progress': 0, 'in-review': 0, completed: 0 },
        total: 0,
      }
      row.counts[a.phase ?? 'in-progress'] += 1
      row.total += 1
      byClass.set(a.className, row)
    })
    const progressByClass = [...byClass.values()].sort((a, b) => b.total - a.total || a.className.localeCompare(b.className))

    // Handed-in work the teacher has not verified yet; the one waiting longest comes first.
    const reviews = assignments
      .flatMap((a) =>
        (a.submissions ?? [])
          .filter((s) => !s.verifiedAt)
          .map((s) => ({
            assignmentId: a.id,
            assignmentTitle: a.title,
            className: a.className,
            student: s.student,
            submittedAt: s.submittedAt,
          })),
      )
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))

    return {
      stats: {
        activeClasses: classes.filter((c) => c.status === 'active').length,
        totalClasses: classes.length,
        students: (isOwn ? sampleStudents.filter(isOwn) : sampleStudents).length,
        assignments: assignments.length,
        dueThisWeek: assignments.filter((a) => a.phase !== 'completed' && daysUntil(a.deadline) >= 0 && daysUntil(a.deadline) <= 7)
          .length,
        awaitingReview: reviews.length,
      },
      phases,
      progressByClass,
      reviews,
      classes: classes.map((c) => {
        const own = assignments.filter((a) => a.className === c.name)
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          students: new Set([...own.flatMap((a) => a.assignees ?? []), ...membersOfClass(requests, c.id).map((m) => m.student)]).size,
          assignments: own.length,
        }
      }),
    }
  }, [assignments, classes, requests, isOwn])
}
