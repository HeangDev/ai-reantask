import type { ActiveStatus } from '@/components/ui/StatusBadge'
import type { Assignment, AssignmentPhase, AssignmentStatus } from '@/features/assignments/types'

export interface DashboardStats {
  total: number
  todo: number
  dueThisWeek: number
  /** Average percentage across graded assignments, or null when none are graded. */
  averageScore: number | null
  /** Assignment count per status. */
  byStatus: Record<AssignmentStatus, number>
  /** Open assignments past their deadline. */
  overdue: number
  /** Score percentage of each graded assignment, in deadline order. */
  gradedPercents: number[]
  /** Assignments the teacher left feedback on. */
  feedbackCount: number
}

export interface DashboardData {
  stats: DashboardStats
  upcoming: Assignment[]
  recent: Assignment[]
}

export type DashboardState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'success'; data: DashboardData }

/** Handed-in work the teacher has not verified yet. */
export interface PendingReview {
  assignmentId: string
  assignmentTitle: string
  className: string
  student: string
  /** ISO date the work was handed in. */
  submittedAt: string
}

export interface ClassSummary {
  id: string
  name: string
  status: ActiveStatus
  students: number
  assignments: number
}

/** How one class's assignments split across the phases. */
export interface ProgressRow {
  className: string
  counts: Record<AssignmentPhase, number>
  total: number
}

export interface TeacherDashboardData {
  stats: {
    activeClasses: number
    totalClasses: number
    students: number
    assignments: number
    dueThisWeek: number
    awaitingReview: number
  }
  /** Assignment count per phase. */
  phases: Record<AssignmentPhase, number>
  /** One row per class that has assignments, the busiest first. */
  progressByClass: ProgressRow[]
  /** Oldest waiting first. */
  reviews: PendingReview[]
  classes: ClassSummary[]
}
