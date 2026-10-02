import { useCallback, useMemo, useState } from 'react'
import { needsAction } from '@/features/assignments/lib/status'
import { useAssignments } from '@/features/assignments/store/assignmentsStore'
import { daysUntil } from '@/features/assignments/lib/dates'
import type { Assignment, AssignmentStatus } from '@/features/assignments/types'
import type { DashboardData, DashboardState } from '@/features/dashboard/types'

const UPCOMING_LIMIT = 5
const RECENT_LIMIT = 5

function buildDashboard(assignments: Assignment[]): DashboardData {
  const gradedPercents = assignments
    .filter((a) => a.status === 'graded' && a.score !== undefined)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .map((a) => Math.round(((a.score ?? 0) / a.maxScore) * 100))
  const averageScore = gradedPercents.length
    ? Math.round(gradedPercents.reduce((sum, p) => sum + p, 0) / gradedPercents.length)
    : null

  const open = assignments.filter(needsAction).sort((a, b) => a.deadline.localeCompare(b.deadline))

  const byStatus: Record<AssignmentStatus, number> = { pending: 0, submitted: 0, graded: 0, late: 0, resubmit: 0 }
  assignments.forEach((a) => (byStatus[a.status] += 1))

  let overdue = 0
  open.forEach((a) => {
    if (daysUntil(a.deadline) < 0) overdue += 1
  })

  return {
    stats: {
      total: assignments.length,
      todo: open.length,
      dueThisWeek: open.filter((a) => daysUntil(a.deadline) <= 7).length,
      averageScore,
      byStatus,
      overdue,
      gradedPercents,
      feedbackCount: assignments.filter((a) => a.feedback).length,
    },
    upcoming: open.slice(0, UPCOMING_LIMIT),
    recent: assignments
      .filter((a) => a.status === 'submitted' || a.status === 'graded')
      .sort((a, b) => b.deadline.localeCompare(a.deadline))
      .slice(0, RECENT_LIMIT),
  }
}

// Derived from placeholder data until an API is documented in docs/api.md.
// The state shape already covers loading and error, so the page won't change once a real query replaces this.
export function useDashboard(): { state: DashboardState; retry: () => void } {
  const assignments = useAssignments()
  const [attempt, setAttempt] = useState(0)

  const state = useMemo<DashboardState>(() => {
    void attempt
    if (assignments.length === 0) return { status: 'empty' }
    return { status: 'success', data: buildDashboard(assignments) }
  }, [attempt, assignments])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}
