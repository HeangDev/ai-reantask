// Public API of the submissions feature (domain rules only so far; the upload UI is not built yet).
export {
  SUBMISSION_ACTIONS,
  SUBMISSION_STATUSES,
  canTransition,
  getAllowedActions,
  isContentLocked,
  isProcessing,
  isTerminal,
  nextTransitions,
} from '@/features/submissions/domain/statusMachine'
export type { Actor, SubmissionAction, SubmissionStatus } from '@/features/submissions/domain/statusMachine'
export {
  applyLatePenalty,
  calculateOverall,
  confidenceLevel,
  isValidCriterionScore,
  isValidOverrideReason,
  needsManualReview,
  requiresOverrideReason,
} from '@/features/submissions/domain/grading'
