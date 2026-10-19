import type { Teacher, TeacherFormErrors, TeacherFormValues } from '@/features/teachers/types'
import { isValidDateOfBirth, isValidEmail, isValidPhone } from '@/shared/lib/validation'

/** Client-side rules: required fields, valid email, and no duplicate email among other teachers. */
export function validateTeacher(input: TeacherFormValues, others: Teacher[]): TeacherFormErrors {
  const errors: TeacherFormErrors = {}
  const email = input.email.trim().toLowerCase()

  if (!input.fullName.trim()) errors.fullName = 'tch.errName'
  if (!isValidEmail(email)) errors.email = 'stu.errEmail'
  else if (others.some((t) => t.email.toLowerCase() === email)) errors.email = 'tch.errEmailTaken'
  if (!input.subject) errors.subject = 'tch.errSubject'
  if (!isValidDateOfBirth(input.dateOfBirth)) errors.dateOfBirth = 'stu.errDob'
  if (!input.sex) errors.sex = 'stu.errSex'
  if (!isValidPhone(input.phone)) errors.phone = 'stu.errPhone'

  return errors
}
