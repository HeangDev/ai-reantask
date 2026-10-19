import type { Role } from '@/shared/types/auth'

// Submission lifecycle, business-rules.md §5. Components ask `getAllowedActions`; they never compare statuses (R-S1).

export const SUBMISSION_STATUSES = [
  'draft',
  'uploading',
  'pushing_to_github',
  'push_failed',
  'pushed',
  'queued',
  'ai_reviewing',
  'ai_reviewed',
  'ai_failed',
  'teacher_reviewing',
  'graded',
  'returned',
  'resubmission_requested',
] as const

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

/** Who moves a submission: a person, or the backend as work finishes. */
export type Actor = Role | 'system'

export const SUBMISSION_ACTIONS = [
  'upload',
  'cancelUpload',
  'retryPush',
  'reupload',
  'viewRepo',
  'viewFeedback',
  'resubmit',
  'startNewAttempt',
  'openReview',
  'continueReview',
  'rerunAi',
  'editGrade',
  'returnGrade',
  'requestResubmission',
  'cancelResubmissionRequest',
  'reopen',
] as const

export type SubmissionAction = (typeof SUBMISSION_ACTIONS)[number]

interface Transition {
  to: SubmissionStatus
  by: readonly Actor[]
  /** The UI action that triggers it, when a person triggers it. */
  action?: SubmissionAction
}

const TEACHER = ['teacher', 'admin'] as const

// ASSUMPTION: moves that the diagram implies but the table does not spell out (marked below) need product sign-off.
const TRANSITIONS: Record<SubmissionStatus, readonly Transition[]> = {
  draft: [{ to: 'uploading', by: ['student'], action: 'upload' }],
  uploading: [
    { to: 'pushing_to_github', by: ['system'] },
    { to: 'draft', by: ['student'], action: 'cancelUpload' },
  ],
  pushing_to_github: [
    { to: 'pushed', by: ['system'] },
    { to: 'push_failed', by: ['system'] },
  ],
  push_failed: [
    { to: 'pushing_to_github', by: ['student'], action: 'retryPush' },
    { to: 'draft', by: ['student'], action: 'reupload' },
  ],
  pushed: [{ to: 'queued', by: ['system'] }],
  queued: [{ to: 'ai_reviewing', by: ['system'] }],
  ai_reviewing: [
    { to: 'ai_reviewed', by: ['system'] },
    { to: 'ai_failed', by: ['system'] },
  ],
  ai_reviewed: [
    { to: 'teacher_reviewing', by: TEACHER, action: 'openReview' },
    { to: 'queued', by: TEACHER, action: 'rerunAi' },
  ],
  ai_failed: [{ to: 'queued', by: TEACHER, action: 'rerunAi' }],
  teacher_reviewing: [
    { to: 'graded', by: TEACHER, action: 'editGrade' },
    { to: 'resubmission_requested', by: TEACHER, action: 'requestResubmission' }, // ASSUMPTION
  ],
  graded: [
    { to: 'teacher_reviewing', by: TEACHER, action: 'continueReview' },
    { to: 'returned', by: TEACHER, action: 'returnGrade' },
    { to: 'resubmission_requested', by: TEACHER, action: 'requestResubmission' }, // ASSUMPTION
  ],
  returned: [
    { to: 'teacher_reviewing', by: TEACHER, action: 'reopen' },
    { to: 'draft', by: ['student'], action: 'resubmit' },
    { to: 'resubmission_requested', by: TEACHER, action: 'requestResubmission' }, // ASSUMPTION
  ],
  resubmission_requested: [
    { to: 'draft', by: ['student'], action: 'startNewAttempt' },
    { to: 'returned', by: TEACHER, action: 'cancelResubmissionRequest' }, // ASSUMPTION
  ],
}

/** Actions that only look at a submission and never change it. */
const VIEW_ACTIONS: Partial<Record<SubmissionStatus, Partial<Record<Role, readonly SubmissionAction[]>>>> = {
  pushed: { student: ['viewRepo'], teacher: ['viewRepo'], admin: ['viewRepo'] },
  queued: { student: ['viewRepo'], teacher: ['viewRepo'], admin: ['viewRepo'] },
  ai_reviewing: { student: ['viewRepo'], teacher: ['viewRepo'], admin: ['viewRepo'] },
  ai_reviewed: { teacher: ['viewRepo'], admin: ['viewRepo'] },
  returned: { student: ['viewFeedback', 'viewRepo'], teacher: ['viewFeedback'], admin: ['viewFeedback'] },
}

/** Where a submission can go next, and who may move it there. */
export const nextTransitions = (status: SubmissionStatus): readonly Transition[] => TRANSITIONS[status]

export const canTransition = (from: SubmissionStatus, to: SubmissionStatus, actor: Actor) =>
  TRANSITIONS[from].some((t) => t.to === to && t.by.includes(actor))

export interface ActionContext {
  /** R-S4: a student may start a new attempt only while attempts remain. */
  attemptsLeft?: boolean
  /** R-T5: in a group, only the team leader uploads and submits. */
  isTeamLeader?: boolean
}

/** What the signed-in role can do with a submission in this status. */
export function getAllowedActions(
  status: SubmissionStatus,
  role: Role,
  { attemptsLeft = true, isTeamLeader = true }: ActionContext = {},
): SubmissionAction[] {
  const moves = TRANSITIONS[status]
    .filter((t): t is Transition & { action: SubmissionAction } => t.action !== undefined && t.by.includes(role))
    .map((t) => t.action)
    .filter((action) => {
      if (role !== 'student') return true
      if (action === 'resubmit' || action === 'startNewAttempt') return attemptsLeft && isTeamLeader
      return isTeamLeader
    })
  return [...new Set([...moves, ...(VIEW_ACTIONS[status]?.[role] ?? [])])]
}

/** The backend is working on it; the UI polls until the status settles (api-integration.md §4). */
export const isProcessing = (status: SubmissionStatus | undefined) =>
  status === 'pushing_to_github' || status === 'queued' || status === 'ai_reviewing'

/** Nothing happens next without a person acting. */
export const isTerminal = (status: SubmissionStatus) => TRANSITIONS[status].every((t) => !t.by.includes('system'))

/** R-S3: once pushed, the content is immutable; a change needs a new attempt. */
export const isContentLocked = (status: SubmissionStatus) =>
  !(status === 'draft' || status === 'uploading' || status === 'push_failed')
