import { useMemo } from 'react'
import { useSession } from '@/features/auth/store/authStore'
import { useTeachers } from '@/features/teachers/store/teachersStore'
import type { Teacher } from '@/features/teachers/types'

/**
 * The teacher profile of the signed-in teacher, found by the email they signed in with.
 * Undefined for other roles, or when no teacher has that email.
 */
export function useCurrentTeacher(): Teacher | undefined {
  const session = useSession()
  const teachers = useTeachers()

  return useMemo(
    () => (session?.role === 'teacher' ? teachers.find((x) => x.email.toLowerCase() === session.email) : undefined),
    [session, teachers],
  )
}

/**
 * The ids of the classes a teacher may see: the ones they teach. Null means no restriction, which is the case for
 * every role except teacher. A teacher with no matching profile teaches nothing, so sees no classes.
 */
export function useTeacherClassScope(): ReadonlySet<string> | null {
  const role = useSession()?.role
  const teacher = useCurrentTeacher()

  return useMemo(() => (role === 'teacher' ? new Set(teacher?.classes ?? []) : null), [role, teacher])
}
