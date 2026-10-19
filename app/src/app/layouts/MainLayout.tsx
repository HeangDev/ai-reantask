import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigation } from 'react-router-dom'
import { RouteTitle } from '@/shared/components/RouteTitle'
import { Header } from '@/app/layouts/Header'
import { MobileNav } from '@/app/layouts/MobileNav'
import { Sidebar } from '@/app/layouts/Sidebar'
import { useMe } from '@/features/auth'
import { useI18n } from '@/shared/i18n'

/** The signed-in shell. `RequireAuth` and `RequireRole` decide who reaches it; this only lays the page out. */
export function MainLayout() {
  const { t } = useI18n()
  useMe() // loads the signed-in user's profile for the header and the Account page
  const { pathname } = useLocation()
  const navigation = useNavigation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // A route change moves focus to the page so keyboard and screen-reader users start at its top (accessibility.md).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus-visible:outline-2 focus-visible:outline-accent"
      >
        {t('a11y.skipToContent')}
      </a>
      <RouteTitle />
      <Sidebar />
      <MobileNav open={menuOpen} onClose={closeMenu} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        {navigation.state === 'loading' && (
          <div role="progressbar" aria-label={t('app.loading')} className="h-0.5 w-full animate-pulse bg-accent" />
        )}
        <main id="main" ref={mainRef} tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
