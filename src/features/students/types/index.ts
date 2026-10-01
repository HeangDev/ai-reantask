export type Sex = 'male' | 'female'

export interface Student {
  id: string
  fullName: string
  email: string
  teacher: string
  /** ISO date (YYYY-MM-DD). */
  dateOfBirth: string
  sex: Sex
  phone: string
  /** ISO date of the last visit; recorded by the system, so absent for a new student. */
  lastVisit?: string
}

// Last visit is not entered by hand.
export type StudentInput = Omit<Student, 'id' | 'lastVisit'>

export type StudentErrorKey =
  | 'stu.errName'
  | 'stu.errEmail'
  | 'stu.errEmailTaken'
  | 'stu.errTeacher'
  | 'stu.errDob'
  | 'stu.errSex'
  | 'stu.errPhone'

export type StudentFormErrors = Partial<Record<keyof StudentInput, StudentErrorKey>>
