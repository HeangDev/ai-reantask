/**
 * Account operations that need a server: changing the password, two-factor authentication,
 * signing other devices out and deleting the account.
 *
 * None of these are documented in docs/api.md yet, so no endpoint is assumed. Until the API exists the
 * simulated service below only waits and resolves, so the screens (loading, success, duplicate-submit
 * protection) can be built and used. Nothing is actually changed, verified or enforced on a server.
 */
export interface AccountService {
  changePassword: (input: { current: string; next: string }) => Promise<void>
  enableTwoFactor: (code: string) => Promise<void>
  disableTwoFactor: () => Promise<void>
  revokeSessions: (ids: string[]) => Promise<void>
  deleteAccount: () => Promise<void>
}

const SIMULATED_DELAY_MS = 700
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))

export const simulatedAccountService: AccountService = {
  changePassword: wait,
  enableTwoFactor: wait,
  disableTwoFactor: wait,
  revokeSessions: wait,
  deleteAccount: wait,
}

// Swap this for the real, API-backed service when it exists.
export const accountService: AccountService = simulatedAccountService
