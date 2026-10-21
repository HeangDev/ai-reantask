import { describeDevice, isPhone, parseUserAgent } from '@/features/account/lib/device'
import { sessionsSchema } from '@/features/account/schemas/session.schemas'
import type { LoginSession } from '@/features/account/types'
import { apiRequest } from '@/shared/api/http'
import { isMockToken } from '@/shared/config/mockMode'
import { getSession } from '@/shared/store/authStore'

/**
 * Account operations that need a server: changing the password, two-factor authentication
 * and deleting the account.
 *
 * Changing the password calls the real API (`PATCH /auth/change-password`). The rest have no API yet, so the
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

/** The signed-in user's active sessions, newest first. */
export async function fetchSessions(signal?: AbortSignal): Promise<LoginSession[]> {
  // A mock sign-in has no server session, so the list is just this browser.
  if (isMockToken(getSession()?.token)) {
    const { os, browser } = parseUserAgent(navigator.userAgent)
    return [
      {
        id: 0,
        device: describeDevice(navigator.userAgent, ''),
        lastActiveAt: Date.now(),
        isCurrent: true,
        kind: isPhone(navigator.userAgent) ? 'phone' : 'desktop',
        os,
        browser,
        ipAddress: '',
        location: null,
      },
    ]
  }
  const { data } = await apiRequest('/users/me/sessions', { params: { size: 50 }, signal, schema: sessionsSchema })
  return data.items.map((s) => ({
    id: s.id,
    device: describeDevice(s.userAgent, s.ipAddress),
    lastActiveAt: Date.parse(s.signedInAt),
    isCurrent: s.current,
    kind: isPhone(s.userAgent) ? 'phone' : 'desktop',
    os: s.os ?? parseUserAgent(s.userAgent).os,
    browser: s.browser ?? parseUserAgent(s.userAgent).browser,
    ipAddress: s.ipAddress,
    location: s.location ?? null,
  }))
}

/** Logs one of the user's own devices out by revoking that session's token (answers 204). */
export const revokeSession = (id: number) => apiRequest(`/users/me/sessions/${id}`, { method: 'DELETE' })

/** Changes the signed-in user's password (`PATCH /auth/change-password`, answers 204). The confirmation is checked in the form. */
export const changePassword = (input: { current: string; next: string }) =>
  apiRequest('/auth/change-password', {
    method: 'PATCH',
    body: { currentPassword: input.current, newPassword: input.next },
  })

// Swap the remaining simulated operations for real, API-backed ones when those endpoints exist.
export const accountService: AccountService = { ...simulatedAccountService }
