import { sampleTeachers } from '@/features/teachers/data/sampleTeachers'
import type { Student } from '@/features/students/types'

// Placeholder data until a students API is documented in docs/api.md.
export const studentTeachers = sampleTeachers.map((teacher) => teacher.fullName)

export const sampleStudents: Student[] = [
  { id: '1', fullName: 'Sokha Chan', email: 'sokha.chan@example.com', teacher: 'Mr. Vireak Sok', dateOfBirth: '2008-03-14', sex: 'male', phone: '+855 12 345 678', lastVisit: '2026-09-29' },
  { id: '2', fullName: 'Dara Kim', email: 'dara.kim@example.com', teacher: 'Ms. Sopheap Chea', dateOfBirth: '2007-11-02', sex: 'male', phone: '+855 15 222 811', lastVisit: '2026-09-30' },
  { id: '3', fullName: 'Vanna Pich', email: 'vanna.pich@example.com', teacher: 'Dr. Rattana Mao', dateOfBirth: '2008-07-21', sex: 'female', phone: '+855 17 908 450', lastVisit: '2026-09-25' },
  { id: '4', fullName: 'Sreyneang Lim', email: 'sreyneang.lim@example.com', teacher: 'Mr. Sambath Ly', dateOfBirth: '2006-01-30', sex: 'female', phone: '+855 96 700 123', lastVisit: '2026-10-01' },
  { id: '5', fullName: 'Rithy Heng', email: 'rithy.heng@example.com', teacher: 'Ms. Leakena Heng', dateOfBirth: '2007-05-09', sex: 'male', phone: '+855 10 456 789', lastVisit: '2026-09-18' },
  { id: '6', fullName: 'Malis Ouk', email: 'malis.ouk@example.com', teacher: 'Mr. Sambath Ly', dateOfBirth: '2006-09-17', sex: 'female', phone: '+855 69 321 654' },
  { id: '7', fullName: 'Piseth Sok', email: 'piseth.sok@example.com', teacher: 'Mr. Vireak Sok', dateOfBirth: '2008-12-05', sex: 'male', phone: '+855 88 765 432', lastVisit: '2026-09-27' },
  { id: '8', fullName: 'Chanthy Roeun', email: 'chanthy.roeun@example.com', teacher: 'Ms. Leakena Heng', dateOfBirth: '2007-02-26', sex: 'female', phone: '+855 93 118 205', lastVisit: '2026-09-30' },
  { id: '9', fullName: 'Veasna Tep', email: 'veasna.tep@example.com', teacher: 'Dr. Rattana Mao', dateOfBirth: '2006-06-11', sex: 'male', phone: '+855 78 640 912', lastVisit: '2026-09-22' },
  { id: '10', fullName: 'Bopha Sen', email: 'bopha.sen@example.com', teacher: 'Ms. Sopheap Chea', dateOfBirth: '2008-10-03', sex: 'female', phone: '+855 81 530 377', lastVisit: '2026-10-01' },
  { id: '11', fullName: 'Narith Yim', email: 'narith.yim@example.com', teacher: 'Mr. Sambath Ly', dateOfBirth: '2007-08-19', sex: 'male', phone: '+855 16 872 046' },
]
