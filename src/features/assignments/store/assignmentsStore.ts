import { useSyncExternalStore } from 'react'
import { sampleAssignments } from '@/features/assignments/data/sampleAssignments'
import type { Assignment } from '@/features/assignments/types'
import { todayIso } from '@/lib/dates'

// Assignments are shared by the teacher's "Set assignments" page and the student's board, so what a
// teacher sets shows up for students. This is a minimal in-memory store until an API is documented.
let assignments: Assignment[] = sampleAssignments
const listeners = new Set<() => void>()

function commit(next: Assignment[]) {
  assignments = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useAssignments = () => useSyncExternalStore(subscribe, () => assignments)

export const assignmentsActions = {
  add: (assignment: Assignment) => commit([...assignments, assignment]),

  update: (id: string, changes: Partial<Assignment>) =>
    commit(assignments.map((a) => (a.id === id ? { ...a, ...changes } : a))),

  remove: (ids: ReadonlySet<string>) => commit(assignments.filter((a) => !ids.has(a.id))),

  /** The teacher verifies a student's work, or withdraws that verification. */
  setVerified: (id: string, student: string, verified: boolean) =>
    commit(
      assignments.map((a) =>
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
    commit(
      assignments.map((a) =>
        a.id === id ? { ...a, submittedFile: fileName, status: a.status === 'late' ? 'late' : 'submitted' } : a,
      ),
    ),
}
