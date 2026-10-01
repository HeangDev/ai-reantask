import type { User, UserFormErrors, UserInput } from '@/features/users/types'
import { isValidEmail, isValidPhone } from '@/lib/validation'

/** Client-side rules: required fields, valid email, and no duplicate email among other users. */
export function validateUser(input: UserInput, others: User[]): UserFormErrors {
  const errors: UserFormErrors = {}
  const email = input.email.trim().toLowerCase()

  if (!input.fullName.trim()) errors.fullName = 'usr.errName'
  if (!isValidEmail(email)) errors.email = 'stu.errEmail'
  else if (others.some((u) => u.email.toLowerCase() === email)) errors.email = 'usr.errEmailTaken'
  if (!isValidPhone(input.phone)) errors.phone = 'stu.errPhone'
  if (!input.role) errors.role = 'usr.errRole'

  return errors
}
