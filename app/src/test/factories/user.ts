import type { AuthUser } from '@/features/auth'
import type { Role } from '@/shared/types/auth'

let sequence = 1

/** An API user (`/auth/me`, `/users`) with sensible defaults. */
export function buildApiUser(overrides: Partial<Omit<AuthUser, 'role'>> & { role?: Role } = {}): AuthUser {
  const id = overrides.id ?? sequence++
  const { role = 'student', ...rest } = overrides
  return {
    id,
    fullname: `User ${id}`,
    username: `user${id}`,
    email: `user${id}@example.com`,
    phone: null,
    avatar: null,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00.000Z',
    role: { id: 1, name: role },
    ...rest,
  }
}
