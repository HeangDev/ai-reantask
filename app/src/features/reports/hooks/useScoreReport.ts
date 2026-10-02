import { useMemo } from 'react'
import { useAssignments } from '@/features/assignments/store/assignmentsStore'
import type { Assignment, Submission } from '@/features/assignments/types'
import { useClassNameScope } from '@/features/classes/hooks/useVisibleClasses'
import type { ScoreRow } from '@/features/reports/types'

/**
 * Points a submission earned: the share of the assignment's tasks marked correct, times the points it is worth.
 * The corrected version counts when there is one. Null while the teacher has not marked any task.
 */
export function scoreOf(assignment: Assignment, submission: Submission): number | null {
  const results = submission.fixedTaskResults ?? submission.taskResults
  const tasks = assignment.tasks ?? []
  if (!results || tasks.length === 0) return null
  const correct = tasks.filter((task) => results[task.id] === 'correct').length
  return Math.round((correct / tasks.length) * assignment.maxScore)
}

/**
 * One row per student with their assignments, submissions and score across the teacher's classes. Worked out from
 * the assignments rather than stored, so it can never drift out of date. Placeholder data until an API exists.
 */
export function useScoreReport(): ScoreRow[] {
  const everyAssignment = useAssignments()
  const scope = useClassNameScope()

  return useMemo(() => {
    const assignments = scope ? everyAssignment.filter((a) => scope.has(a.className)) : everyAssignment
    const rows = new Map<string, ScoreRow>()
    const rowFor = (student: string): ScoreRow => {
      const found = rows.get(student)
      if (found) return found
      const created: ScoreRow = { id: student, student, classes: [], assigned: 0, submitted: 0, graded: 0, earned: 0, possible: 0, percent: null }
      rows.set(student, created)
      return created
    }

    for (const assignment of assignments) {
      for (const student of assignment.assignees ?? []) {
        const row = rowFor(student)
        row.assigned += 1
        if (!row.classes.includes(assignment.className)) row.classes.push(assignment.className)

        const submission = assignment.submissions?.find((s) => s.student === student)
        if (!submission) continue
        row.submitted += 1
        const score = scoreOf(assignment, submission)
        if (score === null) continue
        row.graded += 1
        row.earned += score
        row.possible += assignment.maxScore
      }
    }

    return [...rows.values()].map((row) => ({
      ...row,
      percent: row.possible > 0 ? Math.round((row.earned / row.possible) * 100) : null,
    }))
  }, [everyAssignment, scope])
}
