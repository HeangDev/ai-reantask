import { env } from '@/shared/config/env'
import { getSession } from '@/shared/store/authStore'

/** The stand-in token of a mock sign-in (VITE_USE_MOCKS=true); the real API never issues or accepts it. */
export const MOCK_TOKEN = 'mock-session-token'

/** True only in mock mode, for a session that was created by the mock sign-in. */
export const isMockToken = (token: string | null | undefined): boolean => env.VITE_USE_MOCKS && token === MOCK_TOKEN

/**
 * Whether the signed-in person's classes come from sample data. A teacher always gets sample classes: the API has
 * no teacher-to-class link, so it cannot say which classes a teacher teaches. Everyone else uses the API unless
 * mock mode is on.
 */
export const usesSampleClasses = (): boolean => env.VITE_USE_MOCKS || getSession()?.role === 'teacher'
