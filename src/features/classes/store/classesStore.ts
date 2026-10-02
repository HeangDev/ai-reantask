import { useSyncExternalStore } from 'react'
import { sampleClasses } from '@/features/classes/data/sampleClasses'
import { generateClassCode } from '@/features/classes/lib/classCode'
import type { ClassInput, SchoolClass } from '@/features/classes/types'

// Shared by the Classes page and the places that pick classes (such as the teacher form), so a class
// added or switched off here shows up there. A minimal in-memory store until an API is documented.
let classes: SchoolClass[] = sampleClasses
const listeners = new Set<() => void>()

function commit(next: SchoolClass[]) {
  classes = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useClasses = () => useSyncExternalStore(subscribe, () => classes)

export const classesActions = {
  add: (input: ClassInput) =>
    commit([...classes, { id: crypto.randomUUID(), code: generateClassCode(new Set(classes.map((c) => c.code))), ...input }]),

  update: (id: string, changes: Partial<ClassInput>) =>
    commit(classes.map((c) => (c.id === id ? { ...c, ...changes } : c))),

  remove: (ids: ReadonlySet<string>) => commit(classes.filter((c) => !ids.has(c.id))),
}

/** Classes for a picker. Inactive ones are left out, except those in `keep` so a choice already made still shows. */
export function pickableClasses(all: SchoolClass[], keep: readonly string[] = []): SchoolClass[] {
  return all.filter((c) => c.status === 'active' || keep.includes(c.id))
}
