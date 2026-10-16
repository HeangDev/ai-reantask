import { getSession } from '@/features/auth/store/authStore'
import { apiRequest } from '@/lib/apiClient'
import type { AuthResult, AuthUser, GoogleAuthInput, LoginInput, RegisterInput } from '@/features/auth/types'

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<{ data: AuthResult }>('/auth/login', { method: 'POST', body: input }).then((r) => r.data),
  /** A known, approved account gets a token (AuthResult). A first-time Google user is created as a PENDING student and gets no token (AuthUser). */
  google: (input: GoogleAuthInput) =>
    apiRequest<{ data: AuthResult | AuthUser }>('/auth/google', { method: 'POST', body: input }).then((r) => r.data),
  me: () => apiRequest<{ data: AuthUser }>('/auth/me', { token: getSession()?.token }).then((r) => r.data),
  /** Revokes every token of the user, including the one making the request. */
  logoutAll: () => apiRequest<void>('/auth/logout-all', { method: 'POST', token: getSession()?.token }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  /** The new student is PENDING and gets no token until an admin or a teacher approves the account. */
  register: (input: RegisterInput) =>
    apiRequest<{ data: AuthUser }>('/auth/register', { method: 'POST', body: input }).then((r) => r.data),
}
