import type { Role } from '@/shared/types/auth'

// The permission matrix of business-rules.md §1. The UI uses `can` to show, hide or disable things; routes use guards.
// Frontend checks are UX only: the backend is authoritative.

export const ACTIONS = [
  'class.join',
  'class.create',
  'class.manageCode',
  'assignment.view',
  'assignment.manage',
  'team.manage',
  'team.override',
  'submission.upload',
  'review.view',
  'review.edit',
  'grade.return',
  'ai.rerun',
  'rubric.manage',
  'user.manage',
  'settings.configure',
] as const

export type Action = (typeof ACTIONS)[number]

export interface PermissionUser {
  id: string
  role: Role
}

export interface PermissionResource {
  /** The teacher who owns the class, assignment or rubric. */
  ownerId?: string
  /** R-ST3: a student sees published assignments only. */
  published?: boolean
  /** R-GH6 / R-T5: in a group only the leader uploads. */
  isTeamLeader?: boolean
}

type Rule = (user: PermissionUser, resource?: PermissionResource) => boolean

const is =
  (...roles: Role[]): Rule =>
  (user) =>
    roles.includes(user.role)

/** Admins always pass; a teacher passes for their own resources (or when no owner is named). */
const adminOrOwner: Rule = (user, resource) =>
  user.role === 'admin' || (user.role === 'teacher' && (resource?.ownerId === undefined || resource.ownerId === user.id))

const RULES: Record<Action, Rule> = {
  'class.join': is('student'),
  'class.create': is('teacher', 'admin'),
  'class.manageCode': adminOrOwner,
  // A student sees published assignments only (R-ST3); teachers see their own classes' assignments, admins all.
  'assignment.view': (user, resource) =>
    user.role === 'student' ? resource?.published !== false : adminOrOwner(user, resource),
  'assignment.manage': adminOrOwner,
  'team.manage': is('student'),
  'team.override': is('teacher', 'admin'),
  'submission.upload': (user, resource) => user.role === 'student' && resource?.isTeamLeader !== false,
  'review.view': is('student', 'teacher', 'admin'),
  'review.edit': is('teacher', 'admin'),
  'grade.return': is('teacher', 'admin'),
  'ai.rerun': is('teacher', 'admin'),
  'rubric.manage': adminOrOwner,
  'user.manage': is('admin'),
  'settings.configure': is('admin'),
}

/** Whether the user may perform the action, optionally on a specific resource. */
export const can = (user: PermissionUser | null | undefined, action: Action, resource?: PermissionResource): boolean =>
  user ? RULES[action](user, resource) : false
