import type { AuthResult, AuthUser } from '@/features/auth/types'
import { sampleTeachers } from '@/features/teachers'
import { MOCK_TOKEN, isMockToken } from '@/shared/config/mockMode'
import { env } from '@/shared/config/env'

/** The sample teacher with this email, in mock mode only. Anyone else signs in through the real API. */
const mockTeacherFor = (email: string) =>
  env.VITE_USE_MOCKS ? sampleTeachers.find((x) => x.email.toLowerCase() === email.trim().toLowerCase()) : undefined

const toUser = (teacher: NonNullable<ReturnType<typeof mockTeacherFor>>): AuthUser => ({
  id: Number(teacher.id),
  fullname: teacher.fullName,
  username: teacher.email.split('@')[0] ?? teacher.email,
  email: teacher.email,
  phone: teacher.phone,
  avatar: null,
  status: 'ACTIVE',
  created_at: '2026-09-01T00:00:00Z',
  role: { id: 2, name: 'teacher' },
})

/** A sign-in result for a sample teacher, or undefined when mock mode is off or the email is not a sample teacher. */
export function mockSignIn(email: string): AuthResult | undefined {
  const teacher = mockTeacherFor(email)
  return teacher ? { token: MOCK_TOKEN, token_type: 'Bearer', expires_at: null, user: toUser(teacher) } : undefined
}

/** The user of a mock session, or undefined when the session is not a mock one. */
export function mockMe(token: string | undefined, email: string | undefined): AuthUser | undefined {
  const teacher = isMockToken(token) && email ? mockTeacherFor(email) : undefined
  return teacher ? toUser(teacher) : undefined
}
