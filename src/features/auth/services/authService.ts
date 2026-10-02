/**
 * Signs the user in.
 *
 * No authentication endpoint is documented in docs/api.md yet, so none is assumed. Until the API exists
 * the simulated service below only waits and resolves, so the login screen (loading state, duplicate-submit
 * protection, error display) can be built and used. It does not check the credentials, and the app does not
 * yet keep an authentication state or protect its routes.
 */
export interface AuthService {
  signIn: (credentials: { email: string; password: string }) => Promise<void>
}

const SIMULATED_DELAY_MS = 800

export const simulatedAuthService: AuthService = {
  signIn: () => new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS)),
}

// Swap this for the real, API-backed service when it exists.
export const authService: AuthService = simulatedAuthService
