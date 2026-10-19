import { sessionsSchema } from '@/features/account/schemas/session.schemas'
import type { LoginSession } from '@/features/account/types'
import { apiRequest } from '@/shared/api/http'

/**
 * Account operations that need a server: changing the password, two-factor authentication
 * and deleting the account.
 *
 * Changing the password calls the real API (`PUT /auth/password`). The rest have no API yet, so the
 * simulated service below only waits and resolves, so the screens (loading, success, duplicate-submit
 * protection) can be built and used. Those do not change, verify or enforce anything on a server.
 */
export interface AccountService {
  enableTwoFactor: (code: string) => Promise<void>
  disableTwoFactor: () => Promise<void>
  deleteAccount: () => Promise<void>
}

const SIMULATED_DELAY_MS = 700
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))

export const simulatedAccountService: AccountService = {
  enableTwoFactor: wait,
  disableTwoFactor: wait,
  deleteAccount: wait,
}

/** Active login sessions of a user, newest first. Revoking one session is not in the API yet. */
export async function fetchSessions(userId: number, signal?: AbortSignal): Promise<LoginSession[]> {
  const { data } = await apiRequest(`/users/${userId}/sessions`, {
    params: { per_page: 100 },
    signal,
    schema: sessionsSchema,
  })
  return data.map((s) => ({
    id: s.id,
    device: s.device_name,
    lastActiveAt: Date.parse(s.last_used_at ?? s.created_at),
    isCurrent: s.is_current,
    kind: /iphone|android|mobile/i.test(s.device_name) ? 'phone' : 'desktop',
  }))
}

/** Revokes the account's other sign-ins on the server; the current one keeps working. */
export const changePassword = (input: { current: string; next: string; confirm: string }) =>
  apiRequest('/auth/password', {
    method: 'PUT',
    body: { current_password: input.current, password: input.next, password_confirmation: input.confirm },
  })

// Swap the remaining simulated operations for real, API-backed ones when those endpoints exist.
export const accountService: AccountService = { ...simulatedAccountService }
