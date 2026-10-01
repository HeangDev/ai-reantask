import { isValidDateOfBirth, isValidEmail, isValidPhone } from '@/lib/validation'
import type { Student, StudentFormErrors, StudentInput } from '@/features/students/types'

/** Client-side rules: required fields, valid email, and no duplicate email among other students. */
export function validateStudent(input: StudentInput, others: Student[]): StudentFormErrors {
  const errors: StudentFormErrors = {}
  const email = input.email.trim().toLowerCase()

  if (!input.fullName.trim()) errors.fullName = 'stu.errName'
  if (!isValidEmail(email)) errors.email = 'stu.errEmail'
  else if (others.some((s) => s.email.toLowerCase() === email)) errors.email = 'stu.errEmailTaken'
  if (!input.teacher) errors.teacher = 'stu.errTeacher'
  if (!isValidDateOfBirth(input.dateOfBirth)) errors.dateOfBirth = 'stu.errDob'
  if (!input.sex) errors.sex = 'stu.errSex'
  if (!isValidPhone(input.phone)) errors.phone = 'stu.errPhone'

  return errors
}
