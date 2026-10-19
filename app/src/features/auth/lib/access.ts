import type { Role } from '@/features/auth/types'
import { paths } from '@/shared/config/paths'

/** Where each role lands after signing in. */
export const roleHome: Record<Role, string> = {
  admin: paths.dashboard,
  teacher: paths.dashboard,
  student: paths.dashboard,
}
