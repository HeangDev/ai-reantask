import { useSyncExternalStore } from 'react'
import { sampleTeachers } from '@/features/teachers/data/sampleTeachers'
import type { Teacher, TeacherInput } from '@/features/teachers/types'

// Shared by the Teachers page and everything that needs to know who teaches what (the subject counts,
// the student's class list), so a teacher added or given a class here shows up there.
// A minimal in-memory store until an API is documented.
let teachers: Teacher[] = sampleTeachers
const listeners = new Set<() => void>()

function commit(next: Teacher[]) {
  teachers = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useTeachers = () => useSyncExternalStore(subscribe, () => teachers)

export const teachersActions = {
  add: (input: TeacherInput) => commit([...teachers, { id: crypto.randomUUID(), ...input }]),

  update: (id: string, changes: Partial<TeacherInput>) =>
    commit(teachers.map((x) => (x.id === id ? { ...x, ...changes } : x))),

  remove: (ids: ReadonlySet<string>) => commit(teachers.filter((x) => !ids.has(x.id))),
}
