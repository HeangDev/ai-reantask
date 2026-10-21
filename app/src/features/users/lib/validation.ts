import { isAcceptablePassword } from '@/features/auth'
import type { User, UserFormErrors, UserInput } from '@/features/users/types'
import { isValidEmail, isValidPhone } from '@/shared/lib/validation'
import type { ApiError } from '@/shared/api/errors'

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

/** Turns the API's field errors (400) and conflict codes (409) into errors under the matching form fields. */
export function serverFieldErrors(error: ApiError): UserFormErrors {
  const { code, fieldErrors: fields } = error
  const errors: UserFormErrors = {}
  if (fields.fullname) errors.fullName = 'usr.errName'
  if (code === 'EMAIL_TAKEN' || fields.email) errors.email = 'usr.errEmailTaken'
  if (code === 'PHONE_TAKEN' || fields.phone) errors.phone = 'register.errPhoneTaken'
  if (fields.password) errors.password = 'acct.errPasswordRule'
  if (fields.roleId || code === 'ROLE_INACTIVE' || code === 'ROLE_NOT_FOUND') errors.roleId = 'usr.errRole'
  return errors
}
