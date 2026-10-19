import type { Sex } from '@/features/students'

export interface Teacher {
  id: string
  fullName: string
  email: string
  phone: string
  sex: Sex
  /** ISO date (YYYY-MM-DD). */
  dateOfBirth: string
  subject: string
  /** Ids of the classes this teacher teaches. */
  classes: string[]
}

export type TeacherInput = Omit<Teacher, 'id'>

/** What the form edits: the sex is empty until one is chosen, and validation rejects that before saving. */
export type TeacherFormValues = Omit<TeacherInput, 'sex'> & { sex: Sex | '' }

/** What a teacher has beyond a user account; asked for when an admin adds a user as a teacher. */
export type TeacherDetails = Pick<TeacherInput, 'sex' | 'dateOfBirth' | 'subject'>

export type TeacherErrorKey =
  | 'tch.errName'
  | 'stu.errEmail'
  | 'tch.errEmailTaken'
  | 'tch.errSubject'
  | 'stu.errDob'
  | 'stu.errSex'
  | 'stu.errPhone'

export type TeacherFormErrors = Partial<Record<keyof TeacherFormValues, TeacherErrorKey>>
