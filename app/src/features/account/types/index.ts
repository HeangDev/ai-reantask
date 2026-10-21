import type { TranslationKey } from '@/shared/i18n'

/** One signed-in device, from `GET /users/{user}/sessions`. */
export interface LoginSession {
  id: number
  device: string
  /** Epoch milliseconds of the sign-in. */
  lastActiveAt: number
  isCurrent: boolean
  kind: 'desktop' | 'phone'
}

export type PasswordField = 'current' | 'next' | 'confirm'
export type PasswordValues = Record<PasswordField, string>
export type PasswordErrors = Partial<Record<PasswordField, TranslationKey>>

export type AccountTab = 'profile' | 'security' | 'sessions' | 'delete'
