import type { TranslationKey } from '@/lib/i18n'

export interface LoginSession {
  id: string
  device: string
  location: string
  /** Epoch milliseconds of the last activity. */
  lastActiveAt: number
  isCurrent: boolean
  kind: 'desktop' | 'phone'
}

export type PasswordField = 'current' | 'next' | 'confirm'
export type PasswordValues = Record<PasswordField, string>
export type PasswordErrors = Partial<Record<PasswordField, TranslationKey>>

export type AccountTab = 'profile' | 'security' | 'sessions' | 'delete'
