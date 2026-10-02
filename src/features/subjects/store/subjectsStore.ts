import { useSyncExternalStore } from 'react'
import { sampleSubjects } from '@/features/subjects/data/sampleSubjects'
import type { Subject, SubjectInput } from '@/features/subjects/types'

// Shared by the Subjects page and every subject picker (teachers, classes), so a subject added or
// switched off here shows up there. A minimal in-memory store until an API is documented.
let subjects: Subject[] = sampleSubjects
const listeners = new Set<() => void>()

function commit(next: Subject[]) {
  subjects = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useSubjects = () => useSyncExternalStore(subscribe, () => subjects)

export const subjectsActions = {
  add: (input: SubjectInput) => commit([...subjects, { id: crypto.randomUUID(), ...input }]),

  update: (id: string, changes: Partial<SubjectInput>) =>
    commit(subjects.map((s) => (s.id === id ? { ...s, ...changes } : s))),

  remove: (ids: ReadonlySet<string>) => commit(subjects.filter((s) => !ids.has(s.id))),
}

/** Names for a picker. Inactive subjects are left out, except `keep` so an item that already uses one still shows it. */
export function pickableSubjectNames(all: Subject[], keep?: string): string[] {
  return all.filter((s) => s.status === 'active' || s.name === keep).map((s) => s.name)
}
