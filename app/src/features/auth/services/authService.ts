import { getSession } from '@/features/auth/store/authStore'
import { apiRequest } from '@/lib/apiClient'
import type { AuthResult, AuthUser, LoginInput, RegisterInput } from '@/features/auth/types'

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<{ data: AuthResult }>('/auth/login', { method: 'POST', body: input }).then((r) => r.data),
  me: () => apiRequest<{ data: AuthUser }>('/auth/me', { token: getSession()?.token }).then((r) => r.data),
  /** Revokes every token of the user, including the one making the request. */
  logoutAll: () => apiRequest<void>('/auth/logout-all', { method: 'POST', token: getSession()?.token }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  register: (input: RegisterInput) =>
    apiRequest<{ data: AuthResult }>('/auth/register', { method: 'POST', body: input }).then((r) => r.data),
}
