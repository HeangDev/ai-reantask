import type { Assignment, AssignmentStatus } from '@/features/assignments/types'

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
