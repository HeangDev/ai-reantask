import type { TranslationKey } from '@/lib/i18n'

/** One signed-in device, from `GET /users/{user}/sessions`. */
export interface LoginSession {
  id: number
  device: string
  /** Epoch milliseconds of the last activity (the sign-in time when the token was never used). */
  lastActiveAt: number
  isCurrent: boolean
  kind: 'desktop' | 'phone'
}

export type PasswordField = 'current' | 'next' | 'confirm'
export type PasswordValues = Record<PasswordField, string>
export type PasswordErrors = Partial<Record<PasswordField, TranslationKey>>

export type AccountTab = 'profile' | 'security' | 'sessions' | 'delete'
