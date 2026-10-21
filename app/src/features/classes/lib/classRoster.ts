import { daysUntil } from '@/features/assignments'
import type { Assignment } from '@/features/assignments'
import type { JoinRequest } from '@/features/classes/store/joinRequestsStore'

export interface RosterRow {
  id: string
  name: string
  email: string
  /** Assignments of this class given to the student. */
  assigned: number
  /** Of those, how many the student has handed in work for. */
  submitted: number
}

export interface ClassSummary {
  assignments: number
  /** Unfinished assignments due within a week, overdue ones excluded. */
  dueSoon: number
  /** Handed-in work the teacher has not verified yet. */
  toReview: number
}

const DUE_SOON_DAYS = 7

/** The assignments set for one class. Assignments follow their class by name. */
export function assignmentsOfClass(all: Assignment[], className: string): Assignment[] {
  return all.filter((a) => a.className === className)
}

/** One row per member of the class, with how much of the class's work was given to them and handed in. */
export function buildRoster(
  members: JoinRequest[],
  classAssignments: Assignment[],
  emails: ReadonlyMap<string, string>,
): RosterRow[] {
  return members.map((m) => {
    const mine = classAssignments.filter((a) => a.assignees?.includes(m.student))
    return {
      id: m.studentId,
      name: m.student,
      email: emails.get(m.studentId) ?? '',
      assigned: mine.length,
      submitted: mine.filter((a) => a.submissions?.some((s) => s.student === m.student)).length,
    }
  })
}

export function summarizeClass(classAssignments: Assignment[]): ClassSummary {
  return {
    assignments: classAssignments.length,
    dueSoon: classAssignments.filter((a) => {
      const days = daysUntil(a.deadline)
      return a.phase !== 'completed' && days >= 0 && days <= DUE_SOON_DAYS
    }).length,
    toReview: classAssignments.reduce((sum, a) => sum + (a.submissions?.filter((s) => !s.verifiedAt).length ?? 0), 0),
  }
}
