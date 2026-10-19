import {
  authResultEnvelope,
  authUserEnvelope,
  googleEnvelope,
  messageSchema,
} from '@/features/auth/schemas/auth.schemas'
import type { GoogleAuthInput, LoginInput, RegisterInput } from '@/features/auth/types'
import { apiRequest } from '@/shared/api/http'

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest('/auth/login', { method: 'POST', body: input, schema: authResultEnvelope }).then((r) => r.data),
  google: (input: GoogleAuthInput) =>
    apiRequest('/auth/google', { method: 'POST', body: input, schema: googleEnvelope }).then((r) => r.data),
  me: (signal?: AbortSignal) => apiRequest('/auth/me', { signal, schema: authUserEnvelope }).then((r) => r.data),
  /** Ends this device's session on the server. */
  logout: (token: string) => apiRequest('/auth/logout', { method: 'POST', token }),
  /** Revokes every token of the user, including the one making the request. */
  logoutAll: () => apiRequest('/auth/logout-all', { method: 'POST' }),
  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, schema: messageSchema }),
  /** The new student is PENDING and gets no token until an admin or a teacher approves the account. */
  register: (input: RegisterInput) =>
    apiRequest('/auth/register', { method: 'POST', body: input, schema: authUserEnvelope }).then((r) => r.data),
}
