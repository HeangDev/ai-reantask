import { useMemo } from 'react'
import { assignmentClasses } from '@/features/assignments/data/sampleAssignments'
import { useClassNameScope } from '@/features/classes/hooks/useVisibleClasses'

/** The class names an assignment can be set for: a teacher's own classes, otherwise every class that has assignments. */
export function useAssignableClassNames(): string[] {
  const scope = useClassNameScope()
  return useMemo(() => (scope ? [...scope].sort() : assignmentClasses), [scope])
}
