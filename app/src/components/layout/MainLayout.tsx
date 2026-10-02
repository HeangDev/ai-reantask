import { useCallback, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import RouteTitle from '@/app/RouteTitle'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'
import Sidebar from '@/components/layout/Sidebar'
import { canAccess, roleHome } from '@/features/auth/lib/access'
import { useSession } from '@/features/auth/store/authStore'

export default function MainLayout() {
  const session = useSession()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // Signed-out visitors go to the login page; a role only reaches the pages it is allowed to open.
  if (!session) return <Navigate to="/login" replace />
  if (!canAccess(session.role, pathname)) return <Navigate to={roleHome[session.role]} replace />

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-fg">
      <RouteTitle />
      <Sidebar />
      <MobileNav open={menuOpen} onClose={closeMenu} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
