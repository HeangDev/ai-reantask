import { useMemo } from 'react'
import { useClasses } from '@/features/classes/store/classesStore'
import type { SchoolClass } from '@/features/classes/types'
import { useTeacherClassScope } from '@/features/teachers/hooks/useCurrentTeacher'

/** The classes the signed-in person may see: a teacher only their own, everyone else all of them. */
export function useVisibleClasses(): SchoolClass[] {
  const all = useClasses()
  const scope = useTeacherClassScope()
  return useMemo(() => (scope ? all.filter((c) => scope.has(c.id)) : all), [all, scope])
}

/** The names of the visible classes as a set, or null when there is no restriction. Assignments follow their class by name. */
export function useClassNameScope(): ReadonlySet<string> | null {
  const all = useClasses()
  const scope = useTeacherClassScope()
  return useMemo(() => (scope ? new Set(all.filter((c) => scope.has(c.id)).map((c) => c.name)) : null), [all, scope])
}
