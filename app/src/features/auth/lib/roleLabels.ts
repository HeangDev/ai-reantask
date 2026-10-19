import type { Role } from '@/features/auth/types'
import type { TranslationKey } from '@/shared/i18n'

export const roleLabelKey: Record<Role, TranslationKey> = {
  teacher: 'role.teacher',
  student: 'role.student',
  admin: 'role.admin',
}
