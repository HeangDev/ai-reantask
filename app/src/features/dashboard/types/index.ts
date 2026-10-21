import type { ActiveStatus } from '@/shared/components/StatusBadge'
import type { Assignment, AssignmentPhase, AssignmentStatus } from '@/features/assignments'

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
  /** What the class's teachers teach in it; empty when unknown. */
  subject: string
  students: number
  assignments: number
  /** Of those assignments, how many are completed. */
  completed: number
  /** ISO date of the soonest deadline that is still ahead, or null when nothing is due. */
  nextDeadline: string | null
}

/** An unfinished assignment, for the deadline list. Overdue ones are included. */
export interface UpcomingItem {
  id: string
  title: string
  className: string
  /** ISO date. */
  deadline: string
  /** How many students it was given to. */
  assignees: number
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
  /** Unfinished assignments, soonest deadline first. */
  upcoming: UpcomingItem[]
}
