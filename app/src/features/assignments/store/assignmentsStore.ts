import { sampleAssignments } from '@/features/assignments/data/sampleAssignments'
import type { Assignment } from '@/features/assignments/types'
import { createMockResource } from '@/shared/api/mockResource'
import { todayIso } from '@/shared/lib/dates'

// Assignments are shared by the teacher's "Set assignments" page and the student's board, so what a
// teacher sets shows up for students. A mock resource until an API is documented.
const assignments = createMockResource<Assignment[]>('assignments', sampleAssignments)

export const useAssignments = assignments.useValue

export const assignmentsActions = {
  add: (assignment: Assignment) => assignments.set([...assignments.get(), assignment]),

  update: (id: string, changes: Partial<Assignment>) =>
    assignments.set(assignments.get().map((a) => (a.id === id ? { ...a, ...changes } : a))),

  remove: (ids: ReadonlySet<string>) => assignments.set(assignments.get().filter((a) => !ids.has(a.id))),

  /** The teacher verifies a student's work, or withdraws that verification. */
  setVerified: (id: string, student: string, verified: boolean) =>
    assignments.set(
      assignments.get().map((a) =>
        a.id === id
          ? {
              ...a,
              submissions: a.submissions?.map((s) =>
                s.student === student ? { ...s, verifiedAt: verified ? todayIso() : undefined } : s,
              ),
            }
          : a,
      ),
    ),

  /** A student hands in a file; a late assignment stays late. */
  submitWork: (id: string, fileName: string) =>
    assignments.set(
      assignments
        .get()
        .map((a) => (a.id === id ? { ...a, submittedFile: fileName, status: a.status === 'late' ? 'late' : 'submitted' } : a)),
    ),
}
