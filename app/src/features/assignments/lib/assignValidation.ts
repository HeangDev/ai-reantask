import type { AssignmentPhase, FileType } from '@/features/assignments/types'
import { todayIso } from '@/lib/dates'

/** What the teacher fills in. Numbers are kept as text until validated, like any form input. */
export interface AssignFormValues {
  title: string
  className: string
  description: string
  deadline: string
  phase: AssignmentPhase
  maxScore: string
  maxFileSizeMb: string
  fileTypes: FileType[]
  /** Task titles; blank rows are ignored. */
  tasks: string[]
  assignees: string[]
}

export type AssignErrorKey =
  | 'asg.errTitle'
  | 'asg.errClass'
  | 'asg.errDescription'
  | 'asg.errDeadline'
  | 'asg.errScore'
  | 'asg.errTypes'
  | 'asg.errSize'
  | 'asg.errStudents'

export type AssignFormErrors = Partial<Record<keyof AssignFormValues, AssignErrorKey>>

export const MAX_SCORE_LIMIT = 1000
export const MAX_FILE_SIZE_LIMIT_MB = 100

const isWholeNumberBetween = (value: string, min: number, max: number) => {
  const n = Number(value)
  return value.trim() !== '' && Number.isInteger(n) && n >= min && n <= max
}

export function validateAssignment(values: AssignFormValues): AssignFormErrors {
  const errors: AssignFormErrors = {}
  if (!values.title.trim()) errors.title = 'asg.errTitle'
  if (!values.className) errors.className = 'asg.errClass'
  if (!values.description.trim()) errors.description = 'asg.errDescription'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.deadline) || values.deadline < todayIso()) errors.deadline = 'asg.errDeadline'
  if (!isWholeNumberBetween(values.maxScore, 1, MAX_SCORE_LIMIT)) errors.maxScore = 'asg.errScore'
  if (!isWholeNumberBetween(values.maxFileSizeMb, 1, MAX_FILE_SIZE_LIMIT_MB)) errors.maxFileSizeMb = 'asg.errSize'
  if (values.fileTypes.length === 0) errors.fileTypes = 'asg.errTypes'
  if (values.assignees.length === 0) errors.assignees = 'asg.errStudents'
  return errors
}
