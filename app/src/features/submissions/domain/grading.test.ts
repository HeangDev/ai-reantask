import {
  applyLatePenalty,
  calculateOverall,
  confidenceLevel,
  isValidCriterionScore,
  isValidOverrideReason,
  needsManualReview,
  penaltyFraction,
  requiresOverrideReason,
} from '@/features/submissions/domain/grading'

describe('grading', () => {
  describe('calculateOverall', () => {
    it('R-G1: weights the criterion scores', () => {
      expect(
        calculateOverall([
          { score: 8, weight: 50 },
          { score: 6, weight: 30 },
          { score: 10, weight: 20 },
        ]),
      ).toBe(7.8)
    })

    it('R-G1: rounds to one decimal', () => {
      expect(
        calculateOverall([
          { score: 7, weight: 33.3333 },
          { score: 7, weight: 66.6667 },
        ]),
      ).toBe(7)
      expect(calculateOverall([{ score: 7.33, weight: 100 }])).toBe(7.3)
      expect(calculateOverall([{ score: 7.35, weight: 100 }])).toBe(7.4)
    })

    it('R-G1: no criteria give 0', () => {
      expect(calculateOverall([])).toBe(0)
    })
  })

  describe('isValidCriterionScore', () => {
    it('R-G2: accepts scores from 0 to the maximum in steps of 0.5', () => {
      expect(isValidCriterionScore(0, 10)).toBe(true)
      expect(isValidCriterionScore(7.5, 10)).toBe(true)
      expect(isValidCriterionScore(10, 10)).toBe(true)
    })

    it('R-G2: rejects scores outside the range, off the step, or not numbers', () => {
      expect(isValidCriterionScore(-0.5, 10)).toBe(false)
      expect(isValidCriterionScore(10.5, 10)).toBe(false)
      expect(isValidCriterionScore(7.25, 10)).toBe(false)
      expect(isValidCriterionScore(Number.NaN, 10)).toBe(false)
      expect(isValidCriterionScore(Number.POSITIVE_INFINITY, 10)).toBe(false)
    })
  })

  describe('override reason', () => {
    it('R-G3: needs at least 10 characters, ignoring surrounding spaces', () => {
      expect(isValidOverrideReason('too short')).toBe(false)
      expect(isValidOverrideReason('   short    ')).toBe(false)
      expect(isValidOverrideReason('a clear reason')).toBe(true)
      expect(isValidOverrideReason('1234567890')).toBe(true)
    })

    it('R-G3: a reason is required only when the score differs from the AI score', () => {
      expect(requiresOverrideReason(7, 9)).toBe(true)
      expect(requiresOverrideReason(7, 7)).toBe(false)
    })
  })

  describe('late penalty', () => {
    it('R-G5: final = score x (1 - penalty)', () => {
      expect(applyLatePenalty(80, { percentPerDay: 10, daysLate: 2 })).toEqual({ final: 64, penalty: 16 })
    })

    it('R-G5: no days late means no penalty', () => {
      expect(applyLatePenalty(80, { percentPerDay: 10, daysLate: 0 })).toEqual({ final: 80, penalty: 0 })
    })

    it('R-G5: the penalty never takes more than the whole score', () => {
      expect(penaltyFraction({ percentPerDay: 40, daysLate: 5 })).toBe(1)
      expect(applyLatePenalty(80, { percentPerDay: 40, daysLate: 5 })).toEqual({ final: 0, penalty: 80 })
    })

    it('R-G5: a negative input is treated as no penalty', () => {
      expect(penaltyFraction({ percentPerDay: 10, daysLate: -2 })).toBe(0)
    })
  })

  describe('AI confidence', () => {
    it('R-AI3: low under 0.5, medium 0.5 to 0.8, high over 0.8', () => {
      expect(confidenceLevel(0.49)).toBe('low')
      expect(confidenceLevel(0.5)).toBe('medium')
      expect(confidenceLevel(0.8)).toBe('medium')
      expect(confidenceLevel(0.81)).toBe('high')
    })

    it('R-AI4: only low confidence asks for a manual review', () => {
      expect(needsManualReview(0.3)).toBe(true)
      expect(needsManualReview(0.5)).toBe(false)
      expect(needsManualReview(0.95)).toBe(false)
    })
  })
})
