import type { SchoolClass } from '@/features/classes/types'

/** Classes for a picker. Inactive ones are left out, except those in `keep` so a choice already made still shows. */
export function pickableClasses(all: SchoolClass[], keep: readonly string[] = []): SchoolClass[] {
  return all.filter((c) => c.status === 'active' || keep.includes(c.id))
}
