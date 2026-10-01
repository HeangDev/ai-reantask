import type { Sex } from '@/features/students/types'

export interface Teacher {
  id: string
  fullName: string
  email: string
  phone: string
  sex: Sex
  /** ISO date (YYYY-MM-DD). */
  dateOfBirth: string
  subject: string
}

export type TeacherInput = Omit<Teacher, 'id'>

export type TeacherErrorKey =
  | 'tch.errName'
  | 'stu.errEmail'
  | 'tch.errEmailTaken'
  | 'tch.errSubject'
  | 'stu.errDob'
  | 'stu.errSex'
  | 'stu.errPhone'

export type TeacherFormErrors = Partial<Record<keyof TeacherInput, TeacherErrorKey>>
