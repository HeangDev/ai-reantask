import type { PasswordErrors, PasswordValues } from '@/features/account/types'
import type { TranslationKey } from '@/lib/i18n'

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export const validateName = (name: string): TranslationKey | undefined =>
  name.trim() ? undefined : 'acct.errName'

export function validateAvatar(file: File): TranslationKey | undefined {
  if (!file.type.startsWith('image/')) return 'acct.errAvatarType'
  if (file.size > MAX_AVATAR_BYTES) return 'acct.errAvatarSize'
  return undefined
}

const hasLetterAndNumber = (value: string) => /[A-Za-z]/.test(value) && /\d/.test(value)

/** At least 8 characters with a letter and a number; the new password must differ and be confirmed. */
export function validatePassword({ current, next, confirm }: PasswordValues): PasswordErrors {
  const errors: PasswordErrors = {}
  if (!current) errors.current = 'acct.errCurrent'
  if (next.length < 8 || !hasLetterAndNumber(next)) errors.next = 'acct.errPasswordRule'
  else if (next === current) errors.next = 'acct.errPasswordSame'
  if (confirm !== next) errors.confirm = 'acct.errPasswordMatch'
  return errors
}

/** 0 (too short) to 4 (long, mixed case, digits and symbols). */
export function passwordStrength(value: string): 0 | 1 | 2 | 3 | 4 {
  if (value.length < 8) return 0
  const score =
    1 +
    Number(/[a-z]/.test(value) && /[A-Z]/.test(value)) +
    Number(/\d/.test(value)) +
    Number(/[^A-Za-z0-9]/.test(value))
  return Math.min(4, score) as 1 | 2 | 3 | 4
}

export const isValidCode = (code: string) => /^\d{6}$/.test(code)

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** A random 16-character setup key, shown in groups of four. */
export function generateSetupKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const key = Array.from(bytes, (b) => BASE32[b % 32]).join('')
  return key.match(/.{4}/g)!.join(' ')
}
