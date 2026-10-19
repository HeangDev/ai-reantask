// Grading rules, business-rules.md §8. Frontend maths is for display; the backend decides the grade.

const roundTo = (value: number, digits: number) => {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export interface CriterionScore {
  score: number
  /** Percent of the grade (0-100). The weights of a rubric add up to 100. */
  weight: number
}

/** R-G1: overall = sum of (criterion score x weight), rounded to one decimal. */
export function calculateOverall(criteria: readonly CriterionScore[]): number {
  return roundTo(
    criteria.reduce((total, c) => total + c.score * (c.weight / 100), 0),
    1,
  )
}

/** R-G2: a criterion score is between 0 and the criterion's maximum, in steps of 0.5. */
export function isValidCriterionScore(score: number, maxPoints: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= maxPoints && Number.isInteger(score * 2)
}

export const MIN_OVERRIDE_REASON_LENGTH = 10

/** R-G3 / R-G4: overriding an AI score or the overall score needs a written reason. */
export const isValidOverrideReason = (reason: string) => reason.trim().length >= MIN_OVERRIDE_REASON_LENGTH

/** R-G3: a reason is required only when the teacher's score differs from the AI's. */
export const requiresOverrideReason = (aiScore: number, teacherScore: number) => aiScore !== teacherScore

export interface LatePenalty {
  /** Percent lost per day late. */
  percentPerDay: number
  daysLate: number
}

/** The share of the score that is lost, between 0 and 1. */
export const penaltyFraction = ({ percentPerDay, daysLate }: LatePenalty) =>
  Math.min(1, Math.max(0, (percentPerDay * daysLate) / 100))

/** R-G5: the late penalty applies after any override: final = score x (1 - penalty). */
export function applyLatePenalty(score: number, penalty: LatePenalty): { final: number; penalty: number } {
  const fraction = penaltyFraction(penalty)
  return { final: roundTo(score * (1 - fraction), 1), penalty: roundTo(score * fraction, 1) }
}

export type ConfidenceLevel = 'low' | 'medium' | 'high'

/** R-AI3: low is under 0.5, medium 0.5 to 0.8, high over 0.8. */
export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence < 0.5) return 'low'
  if (confidence > 0.8) return 'high'
  return 'medium'
}

/** R-AI4: low confidence shows the "manual review recommended" banner. */
export const needsManualReview = (confidence: number) => confidenceLevel(confidence) === 'low'
