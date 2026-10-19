import { useMemo } from 'react'
import { useSession } from '@/shared/store/authStore'
import { useClasses } from '@/features/classes/api/useClasses'
import type { SchoolClass } from '@/features/classes/types'

/** The classes the signed-in person may see. The API already limits a teacher or student to their own classes. */
export function useVisibleClasses(): SchoolClass[] {
  return useClasses()
}

/** The names of a teacher's classes as a set, or null when there is no restriction. Assignments follow their class by name. */
export function useClassNameScope(): ReadonlySet<string> | null {
  const role = useSession()?.role
  const all = useClasses()
  return useMemo(() => (role === 'teacher' ? new Set(all.map((c) => c.name)) : null), [role, all])
}
