import type { SchoolClass } from '@/features/classes/types'
import type { Teacher } from '@/features/teachers/types'

export interface ClassTeaching {
  /** Names of the teachers assigned to the class. */
  teachers: string[]
  /** Subjects those teachers teach, without repeats. */
  subjects: string[]
}

/**
 * Who teaches a class and which subject it covers. Not stored on the class: a teacher is given classes in the
 * teacher form, and a class's subject is what its teachers teach, so this can never drift out of date.
 */
export function teachingOf(schoolClass: SchoolClass, teachers: Teacher[]): ClassTeaching {
  const own = teachers.filter((x) => x.classes.includes(schoolClass.id))
  return {
    teachers: own.map((x) => x.fullName),
    subjects: [...new Set(own.map((x) => x.subject))],
  }
}
