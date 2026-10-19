import { ACTIONS, can } from '@/features/auth/domain/permissions'
import type { Action } from '@/features/auth/domain/permissions'
import type { Role } from '@/shared/types/auth'

const user = (role: Role, id = 'u1') => ({ id, role })

// business-rules.md §1, one row per action: who may do it without naming a resource.
const MATRIX: Record<Action, Role[]> = {
  'class.join': ['student'],
  'class.create': ['teacher', 'admin'],
  'class.manageCode': ['teacher', 'admin'],
  'assignment.view': ['student', 'teacher', 'admin'],
  'assignment.manage': ['teacher', 'admin'],
  'team.manage': ['student'],
  'team.override': ['teacher', 'admin'],
  'submission.upload': ['student'],
  'review.view': ['student', 'teacher', 'admin'],
  'review.edit': ['teacher', 'admin'],
  'grade.return': ['teacher', 'admin'],
  'ai.rerun': ['teacher', 'admin'],
  'rubric.manage': ['teacher', 'admin'],
  'user.manage': ['admin'],
  'settings.configure': ['admin'],
}

describe('can(user, action, resource)', () => {
  it.each(ACTIONS)('permission matrix: %s', (action) => {
    for (const role of ['student', 'teacher', 'admin'] as const) {
      expect(can(user(role), action)).toBe(MATRIX[action].includes(role))
    }
  })

  it('a signed-out visitor can do nothing', () => {
    for (const action of ACTIONS) {
      expect(can(null, action)).toBe(false)
      expect(can(undefined, action)).toBe(false)
    }
  })

  it('R-ST3: a student sees published assignments only', () => {
    expect(can(user('student'), 'assignment.view', { published: true })).toBe(true)
    expect(can(user('student'), 'assignment.view', { published: false })).toBe(false)
  })

  it('a teacher manages only their own classes, assignments and rubrics', () => {
    const own = { ownerId: 'u1' }
    const other = { ownerId: 'u2' }
    for (const action of ['class.manageCode', 'assignment.manage', 'rubric.manage'] as const) {
      expect(can(user('teacher', 'u1'), action, own)).toBe(true)
      expect(can(user('teacher', 'u1'), action, other)).toBe(false)
    }
  })

  it('a teacher sees only their own classes assignments', () => {
    expect(can(user('teacher', 'u1'), 'assignment.view', { ownerId: 'u2' })).toBe(false)
    expect(can(user('teacher', 'u1'), 'assignment.view', { ownerId: 'u1' })).toBe(true)
  })

  it('an admin manages everything regardless of the owner', () => {
    for (const action of ['class.manageCode', 'assignment.manage', 'rubric.manage', 'assignment.view'] as const) {
      expect(can(user('admin'), action, { ownerId: 'someone-else' })).toBe(true)
    }
  })

  it('R-GH6 / R-T5: only the team leader uploads for a group', () => {
    expect(can(user('student'), 'submission.upload', { isTeamLeader: true })).toBe(true)
    expect(can(user('student'), 'submission.upload', { isTeamLeader: false })).toBe(false)
  })

  it('R-GH6: a teacher never uploads for a student', () => {
    expect(can(user('teacher'), 'submission.upload', { isTeamLeader: true })).toBe(false)
  })
})
