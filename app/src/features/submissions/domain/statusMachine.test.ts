import {
  SUBMISSION_ACTIONS,
  SUBMISSION_STATUSES,
  canTransition,
  getAllowedActions,
  isContentLocked,
  isProcessing,
  isTerminal,
  nextTransitions,
} from '@/features/submissions/domain/statusMachine'
import type { Actor, SubmissionStatus } from '@/features/submissions/domain/statusMachine'

const ACTORS: Actor[] = ['student', 'teacher', 'admin', 'system']

describe('submission status machine', () => {
  it('R-S1: every status has a transition list and every transition targets a known status', () => {
    for (const status of SUBMISSION_STATUSES) {
      for (const move of nextTransitions(status)) expect(SUBMISSION_STATUSES).toContain(move.to)
    }
  })

  it('R-S1: every UI action is reachable from at least one status for some role', () => {
    const reachable = new Set(
      SUBMISSION_STATUSES.flatMap((status) => (['student', 'teacher', 'admin'] as const).flatMap((role) => getAllowedActions(status, role))),
    )
    for (const action of SUBMISSION_ACTIONS) expect(reachable).toContain(action)
  })

  describe('valid transitions', () => {
    const valid: [SubmissionStatus, SubmissionStatus, Actor][] = [
      ['draft', 'uploading', 'student'],
      ['uploading', 'pushing_to_github', 'system'],
      ['uploading', 'draft', 'student'],
      ['pushing_to_github', 'pushed', 'system'],
      ['pushing_to_github', 'push_failed', 'system'],
      ['push_failed', 'pushing_to_github', 'student'],
      ['push_failed', 'draft', 'student'],
      ['pushed', 'queued', 'system'],
      ['queued', 'ai_reviewing', 'system'],
      ['ai_reviewing', 'ai_reviewed', 'system'],
      ['ai_reviewing', 'ai_failed', 'system'],
      ['ai_reviewed', 'teacher_reviewing', 'teacher'],
      ['ai_reviewed', 'queued', 'admin'],
      ['ai_failed', 'queued', 'teacher'],
      ['teacher_reviewing', 'graded', 'teacher'],
      ['graded', 'returned', 'teacher'],
      ['graded', 'teacher_reviewing', 'admin'],
      ['returned', 'teacher_reviewing', 'teacher'],
      ['returned', 'draft', 'student'],
      ['resubmission_requested', 'draft', 'student'],
    ]

    it.each(valid)('R-S1: %s -> %s by %s is allowed', (from, to, actor) => {
      expect(canTransition(from, to, actor)).toBe(true)
    })
  })

  describe('invalid transitions', () => {
    it('R-S1: a student cannot grade, return or re-run the AI', () => {
      expect(canTransition('teacher_reviewing', 'graded', 'student')).toBe(false)
      expect(canTransition('graded', 'returned', 'student')).toBe(false)
      expect(canTransition('ai_failed', 'queued', 'student')).toBe(false)
    })

    it('R-S1: a teacher cannot upload or retry a push for the student', () => {
      expect(canTransition('draft', 'uploading', 'teacher')).toBe(false)
      expect(canTransition('push_failed', 'pushing_to_github', 'teacher')).toBe(false)
    })

    it('R-S1: only the system moves a submission through the automatic steps', () => {
      for (const actor of ['student', 'teacher', 'admin'] as const) {
        expect(canTransition('pushing_to_github', 'pushed', actor)).toBe(false)
        expect(canTransition('queued', 'ai_reviewing', actor)).toBe(false)
        expect(canTransition('ai_reviewing', 'ai_reviewed', actor)).toBe(false)
      }
    })

    it('R-S1: steps cannot be skipped', () => {
      expect(canTransition('draft', 'pushed', 'system')).toBe(false)
      expect(canTransition('pushed', 'graded', 'teacher')).toBe(false)
      expect(canTransition('ai_reviewed', 'returned', 'teacher')).toBe(false)
    })

    it('R-S1: nothing moves a submission into the status it is already in', () => {
      for (const status of SUBMISSION_STATUSES) {
        for (const actor of ACTORS) expect(canTransition(status, status, actor)).toBe(false)
      }
    })
  })

  describe('getAllowedActions', () => {
    it('R-S1: a student in draft can upload and nothing else', () => {
      expect(getAllowedActions('draft', 'student')).toEqual(['upload'])
    })

    it('R-S1: a student can cancel while uploading', () => {
      expect(getAllowedActions('uploading', 'student')).toEqual(['cancelUpload'])
    })

    it('R-S1: after a failed push the student can retry or re-upload, and the teacher can only view', () => {
      expect(getAllowedActions('push_failed', 'student')).toEqual(['retryPush', 'reupload'])
      expect(getAllowedActions('push_failed', 'teacher')).toEqual([])
    })

    it('R-S1: while the AI is working everyone can only view the repository', () => {
      for (const status of ['pushed', 'queued', 'ai_reviewing'] as const) {
        expect(getAllowedActions(status, 'student')).toEqual(['viewRepo'])
        expect(getAllowedActions(status, 'teacher')).toEqual(['viewRepo'])
      }
    })

    it('R-S1: a finished AI review lets the teacher open it or re-run the AI, but shows the student nothing', () => {
      expect(getAllowedActions('ai_reviewed', 'teacher')).toEqual(expect.arrayContaining(['openReview', 'rerunAi']))
      expect(getAllowedActions('ai_reviewed', 'student')).toEqual([])
    })

    it('R-S1: a failed AI review can be re-run by a teacher or an admin', () => {
      expect(getAllowedActions('ai_failed', 'teacher')).toEqual(['rerunAi'])
      expect(getAllowedActions('ai_failed', 'admin')).toEqual(['rerunAi'])
      expect(getAllowedActions('ai_failed', 'student')).toEqual([])
    })

    it('R-S1: a graded submission can be edited or returned by a teacher, and the student sees nothing', () => {
      expect(getAllowedActions('graded', 'teacher')).toEqual(expect.arrayContaining(['continueReview', 'returnGrade']))
      expect(getAllowedActions('graded', 'student')).toEqual([])
    })

    it('R-G7: a returned grade shows feedback to the student and can be reopened by a teacher', () => {
      expect(getAllowedActions('returned', 'student')).toEqual(expect.arrayContaining(['viewFeedback', 'resubmit']))
      expect(getAllowedActions('returned', 'teacher')).toEqual(expect.arrayContaining(['reopen']))
    })

    it('R-S4: a student cannot resubmit when no attempts are left', () => {
      const actions = getAllowedActions('returned', 'student', { attemptsLeft: false })
      expect(actions).not.toContain('resubmit')
      expect(actions).toContain('viewFeedback')
    })

    it('R-S4: a requested resubmission needs an attempt too', () => {
      expect(getAllowedActions('resubmission_requested', 'student')).toContain('startNewAttempt')
      expect(getAllowedActions('resubmission_requested', 'student', { attemptsLeft: false })).not.toContain('startNewAttempt')
    })

    it('R-T5: a group member who is not the leader cannot upload', () => {
      expect(getAllowedActions('draft', 'student', { isTeamLeader: false })).toEqual([])
    })

    it('R-T5: a non-leader can still see the repository', () => {
      expect(getAllowedActions('pushed', 'student', { isTeamLeader: false })).toEqual(['viewRepo'])
    })

    it('R-S1: the team-leader and attempt limits never restrict a teacher', () => {
      expect(getAllowedActions('returned', 'teacher', { attemptsLeft: false, isTeamLeader: false })).toContain('reopen')
    })

    it('R-S1: a teacher can cancel a resubmission request', () => {
      expect(getAllowedActions('resubmission_requested', 'teacher')).toEqual(['cancelResubmissionRequest'])
    })
  })

  describe('helpers', () => {
    it('R-S1: polling continues only while the backend is working', () => {
      expect(isProcessing('pushing_to_github')).toBe(true)
      expect(isProcessing('queued')).toBe(true)
      expect(isProcessing('ai_reviewing')).toBe(true)
      expect(isProcessing('ai_reviewed')).toBe(false)
      expect(isProcessing('graded')).toBe(false)
      expect(isProcessing(undefined)).toBe(false)
    })

    it('R-S1: a status is terminal when only a person can move it on', () => {
      expect(isTerminal('draft')).toBe(true)
      expect(isTerminal('ai_reviewed')).toBe(true)
      expect(isTerminal('pushing_to_github')).toBe(false)
      expect(isTerminal('queued')).toBe(false)
    })

    it('R-S3: content is mutable only before the push succeeds', () => {
      expect(isContentLocked('draft')).toBe(false)
      expect(isContentLocked('uploading')).toBe(false)
      expect(isContentLocked('push_failed')).toBe(false)
      expect(isContentLocked('pushed')).toBe(true)
      expect(isContentLocked('graded')).toBe(true)
      expect(isContentLocked('returned')).toBe(true)
    })
  })
})
