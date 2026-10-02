import type { Role } from '@/features/auth/types'

const shared = ['/dashboard', '/tasks', '/notifications', '/account', '/settings']

// Which pages each role may open. A path also covers the pages under it (such as /assign/:id).
const allowed: Record<Role, string[]> = {
  student: [...shared, '/assignments', '/my-classes'],
  teacher: [...shared, '/assign', '/students', '/teachers', '/classes', '/subjects', '/users', '/integration'],
}

/** Where each role lands after signing in. */
export const roleHome: Record<Role, string> = {
  teacher: '/dashboard',
  student: '/assignments',
}

export const canAccess = (role: Role, pathname: string) =>
  pathname === '/' || allowed[role].some((path) => pathname === path || pathname.startsWith(`${path}/`))
