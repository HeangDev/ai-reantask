// Public API of the assignments feature. Other features and the app import only from here.
export { DueLabel } from '@/features/assignments/components/DueLabel'
export { statusStyles } from '@/features/assignments/components/StatusBadge'
export { assignmentClasses } from '@/features/assignments/data/sampleAssignments'
export { daysUntil, formatDate } from '@/features/assignments/lib/dates'
export { needsAction } from '@/features/assignments/lib/status'
export { useAssignments } from '@/features/assignments/store/assignmentsStore'
export type { Assignment, AssignmentPhase, AssignmentStatus, Submission } from '@/features/assignments/types'
