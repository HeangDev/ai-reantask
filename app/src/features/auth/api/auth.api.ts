import {
  apiUserEnvelope,
  googleEnvelope,
  messageSchema,
  tokenEnvelope,
} from '@/features/auth/schemas/auth.schemas'
import type { AuthResult, AuthUser, GoogleAuthInput, LoginInput, RegisterInput, UpdateProfileInput } from '@/features/auth/types'
import { mockMe, mockSignIn } from '@/features/auth/lib/mockSession'
import { apiRequest } from '@/shared/api/http'
import { getSession } from '@/shared/store/authStore'

export const authApi = {
  /** The login answer holds only a token, so the user and role are read with it right after. */
  login: async ({ email, password }: LoginInput): Promise<AuthResult> => {
    // Mock mode lets a sample teacher in without the API, so their screens can be seen with sample data.
    const mock = mockSignIn(email)
    if (mock) return mock
    const { data: token } = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
      schema: tokenEnvelope,
    })
    const { data: user } = await apiRequest('/users/me', { token: token.accessToken, schema: apiUserEnvelope })
    return { token: token.accessToken, token_type: token.tokenType, expires_at: null, user }
  },
  /** An approved account gets a token (AuthResult); a first-time Google user is created PENDING, with none (AuthUser). */
  google: async ({ credential }: GoogleAuthInput): Promise<AuthResult | AuthUser> => {
    const { data } = await apiRequest('/auth/google', { method: 'POST', body: { credential }, schema: googleEnvelope })
    if (!data.token) return data.user
    return { token: data.token.accessToken, token_type: data.token.tokenType, expires_at: null, user: data.user }
  },
  me: (signal?: AbortSignal) => {
    const session = getSession()
    const mock = mockMe(session?.token, session?.email)
    return mock ? Promise.resolve(mock) : apiRequest('/users/me', { signal, schema: apiUserEnvelope }).then((r) => r.data)
  },
  /** Saves the signed-in user's own profile; the answer is the updated user. */
  updateProfile: (input: UpdateProfileInput) =>
    apiRequest('/users/me', { method: 'PUT', body: input, schema: apiUserEnvelope }).then((r) => r.data),
  /** Ends this device's session on the server. */
  logout: (token: string) => apiRequest('/auth/logout', { method: 'POST', token }),
  /** Revokes every token of the user, including the one making the request. */
  logoutAll: () => apiRequest('/auth/logout-all', { method: 'POST' }),
  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, schema: messageSchema }),
  /** The new student is PENDING and gets no token until an admin or a teacher approves the account. */
  register: (input: RegisterInput) =>
    apiRequest('/auth/register', { method: 'POST', body: input, schema: apiUserEnvelope }).then((r) => r.data),
}
