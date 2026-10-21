// Public API of the teachers feature. Other features and the app import only from here.
export { useCurrentTeacher, useTeacherClassScope } from '@/features/teachers/hooks/useCurrentTeacher'
export { sampleTeachers } from '@/features/teachers/data/sampleTeachers'
export { validateTeacher } from '@/features/teachers/lib/validation'
export { teachersActions, useTeachers } from '@/features/teachers/store/teachersStore'
export type { Teacher, TeacherDetails } from '@/features/teachers/types'
