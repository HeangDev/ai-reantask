import { useMemo } from 'react'
import { useSession } from '@/shared/store/authStore'
import { useClasses } from '@/features/classes/api/useClasses'
import type { SchoolClass } from '@/features/classes/types'
import { useTeacherClassScope } from '@/features/teachers'

/**
 * Keeps only the classes a teacher teaches. The classes API does not limit a teacher (it has no teacher-to-class
 * link yet), so the scope comes from the teacher profile. A null scope means no restriction.
 */
export function inScope(classes: SchoolClass[], scope: ReadonlySet<string> | null): SchoolClass[] {
  return scope ? classes.filter((c) => scope.has(c.id)) : classes
}

/** The classes the signed-in person may see: a teacher sees only the ones they teach. */
export function useVisibleClasses(): SchoolClass[] {
  const all = useClasses()
  const scope = useTeacherClassScope()
  return useMemo(() => inScope(all, scope), [all, scope])
}

/** The names of a teacher's classes as a set, or null when there is no restriction. Assignments follow their class by name. */
export function useClassNameScope(): ReadonlySet<string> | null {
  const role = useSession()?.role
  const visible = useVisibleClasses()
  return useMemo(() => (role === 'teacher' ? new Set(visible.map((c) => c.name)) : null), [role, visible])
}
