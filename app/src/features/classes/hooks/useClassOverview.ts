import { useMemo } from 'react'
import { teachingOf } from '@/features/classes/lib/classTeaching'
import { membersOfClass, useJoinRequests } from '@/features/classes/store/joinRequestsStore'
import type { SchoolClass } from '@/features/classes/types'
import { useTeachers } from '@/features/teachers/store/teachersStore'

export interface ClassOverview {
  /** Subjects taught in the class, joined with commas; empty when none is known. */
  subject: string
  totalStudents: number
}

/**
 * The subject and student total of each class, by class id. The classes API returns neither yet, so both come
 * from the local teacher and join-request stores. Replace this hook when the API exposes them.
 */
export function useClassOverview(classes: SchoolClass[]): Record<string, ClassOverview> {
  const teachers = useTeachers()
  const requests = useJoinRequests()

  return useMemo(
    () =>
      Object.fromEntries(
        classes.map((c) => [
          c.id,
          {
            subject: teachingOf(c, teachers).subjects.join(', '),
            totalStudents: membersOfClass(requests, c.id).length,
          },
        ]),
      ),
    [classes, teachers, requests],
  )
}
