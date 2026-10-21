import type { TranslationKey } from '@/shared/i18n'

/** One signed-in device, from `GET /users/{user}/sessions`. */
export interface LoginSession {
  id: number
  device: string
  /** Epoch milliseconds of the sign-in. */
  lastActiveAt: number
  isCurrent: boolean
  kind: 'desktop' | 'phone'
  /** Operating system and browser read from the User-Agent; either may be empty. */
  os: string
  browser: string
  /** Null when the API did not send one. */
  ipAddress: string | null
  /** City / country when the API sends one; null otherwise (the browser never looks an IP address up itself). */
  location: string | null
}

export type PasswordField = 'current' | 'next' | 'confirm'
export type PasswordValues = Record<PasswordField, string>
export type PasswordErrors = Partial<Record<PasswordField, TranslationKey>>

export type AccountTab = 'profile' | 'security' | 'sessions' | 'delete'
