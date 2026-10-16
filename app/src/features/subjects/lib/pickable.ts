import type { Subject } from '@/features/subjects/types'

/** Names for a picker. Inactive subjects are left out, except `keep` so an item that already uses one still shows it. */
export function pickableSubjectNames(all: Subject[], keep?: string): string[] {
  return all.filter((s) => s.status === 'active' || s.name === keep).map((s) => s.name)
}
