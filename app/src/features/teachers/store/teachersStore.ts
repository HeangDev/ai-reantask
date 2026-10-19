import { sampleTeachers } from '@/features/teachers/data/sampleTeachers'
import type { Teacher, TeacherInput } from '@/features/teachers/types'
import { createMockResource } from '@/shared/api/mockResource'

// Shared by the Teachers page and everything that needs to know who teaches what (the subject counts,
// the student's class list), so a teacher added or given a class here shows up there.
// A mock resource until an API is documented.
const teachers = createMockResource<Teacher[]>('teachers', sampleTeachers)

export const useTeachers = teachers.useValue

export const teachersActions = {
  add: (input: TeacherInput) => teachers.set([...teachers.get(), { id: crypto.randomUUID(), ...input }]),

  update: (id: string, changes: Partial<TeacherInput>) =>
    teachers.set(teachers.get().map((x) => (x.id === id ? { ...x, ...changes } : x))),

  remove: (ids: ReadonlySet<string>) => teachers.set(teachers.get().filter((x) => !ids.has(x.id))),
}
