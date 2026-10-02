import { useMemo } from 'react'
import { useAssignments } from '@/features/assignments/store/assignmentsStore'
import { useClassNameScope, useVisibleClasses } from '@/features/classes/hooks/useVisibleClasses'
import { membersOfClass, useJoinRequests } from '@/features/classes/store/joinRequestsStore'
import type { Student } from '@/features/students/types'
import { useCurrentTeacher } from '@/features/teachers/hooks/useCurrentTeacher'
import { useSession } from '@/features/auth/store/authStore'

/**
 * Tells whether a student is one of the signed-in teacher's own: the teacher is theirs, or the student is in one
 * of the classes they teach (given an assignment from it, or approved into it). Null means no restriction, which
 * is the case for every role except teacher, so an admin sees all students.
 */
export function useOwnStudentFilter(): ((student: Student) => boolean) | null {
  const role = useSession()?.role
  const teacher = useCurrentTeacher()
  const assignments = useAssignments()
  const classes = useVisibleClasses()
  const classNames = useClassNameScope()
  const requests = useJoinRequests()

  return useMemo(() => {
    if (role !== 'teacher') return null
    const inMyClasses = new Set([
      ...assignments.filter((a) => classNames?.has(a.className)).flatMap((a) => a.assignees ?? []),
      ...classes.flatMap((c) => membersOfClass(requests, c.id).map((m) => m.student)),
    ])
    return (student) => student.teacher === teacher?.fullName || inMyClasses.has(student.fullName)
  }, [role, teacher, assignments, classes, classNames, requests])
}
