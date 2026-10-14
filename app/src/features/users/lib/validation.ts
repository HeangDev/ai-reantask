import { isAcceptablePassword } from '@/features/account/lib/validation'
import type { User, UserFormErrors, UserInput } from '@/features/users/types'
import { isValidEmail, isValidPhone } from '@/lib/validation'

/**
 * Client-side rules: required fields, valid email, and no duplicate email among the loaded users.
 * `password` is given only when creating a user. The server still has the final say (see serverFieldErrors).
 */
export function validateUser(
  input: UserInput,
  others: User[],
  password?: { value: string; confirm: string },
): UserFormErrors {
  const errors: UserFormErrors = {}
  const email = input.email.trim().toLowerCase()

  if (!input.fullName.trim()) errors.fullName = 'usr.errName'
  if (!isValidEmail(email)) errors.email = 'stu.errEmail'
  else if (others.some((u) => u.email.toLowerCase() === email)) errors.email = 'usr.errEmailTaken'
  if (!isValidPhone(input.phone)) errors.phone = 'stu.errPhone'
  if (!input.roleId) errors.roleId = 'usr.errRole'
  if (password) {
    if (!isAcceptablePassword(password.value)) errors.password = 'acct.errPasswordRule'
    if (password.confirm !== password.value) errors.confirm = 'acct.errPasswordMatch'
  }

  return errors
}

/** Turns the API's 422 field errors into errors under the matching form fields. */
export function serverFieldErrors(fields: Record<string, string[]>): UserFormErrors {
  const errors: UserFormErrors = {}
  if (fields.fullname) errors.fullName = 'usr.errName'
  // The username is made from the email, so a clash is shown on the email field.
  if (fields.email || fields.username) errors.email = 'usr.errEmailTaken'
  if (fields.phone) errors.phone = 'register.errPhoneTaken'
  if (fields.password) errors.password = 'acct.errPasswordRule'
  if (fields.role_id) errors.roleId = 'usr.errRole'
  return errors
}
