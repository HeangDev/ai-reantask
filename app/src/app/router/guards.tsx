import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/shared/config/paths'
import { useSession } from '@/shared/store/authStore'
import type { Role } from '@/shared/types/auth'

/** Signed-out visitors go to the login page and come back to where they were (routing.md §3). */
export function RequireAuth() {
  const session = useSession()
  const location = useLocation()
  if (!session) {
    const returnTo = `${location.pathname}${location.search}`
    const search = returnTo === paths.home ? '' : `?returnTo=${encodeURIComponent(returnTo)}`
    return <Navigate to={`${paths.login}${search}`} replace />
  }
  return <Outlet />
}

/** UX only: the wrong role sees the 403 page. The API enforces the real access rules. */
export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const session = useSession()
  if (!session || !roles.includes(session.role)) return <Navigate to={paths.forbidden} replace />
  return <Outlet />
}
