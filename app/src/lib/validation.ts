import { todayIso } from '@/lib/dates'

/** Longest description a class or subject may have. */
export const MAX_DESCRIPTION_LENGTH = 120

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[\d\s-]+$/

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim())

/** 7 to 15 digits, with spaces, dashes and a leading + allowed. */
export function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, '').length
  return PHONE_PATTERN.test(phone.trim()) && digits >= 7 && digits <= 15
}

/** An ISO date (YYYY-MM-DD) that is not in the future. */
export const isValidDateOfBirth = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso <= todayIso()
