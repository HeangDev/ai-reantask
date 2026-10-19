import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/app/router'
import { navItemsFor } from '@/shared/config/navItems'
import { I18nProvider } from '@/shared/i18n'
import { ToastProvider } from '@/shared/components/Toast'
import { queryClient } from '@/shared/api/queryClient'
import { useAuthStore } from '@/shared/store/authStore'
import type { Role } from '@/shared/types/auth'

function renderAt(path: string, role?: Role) {
  useAuthStore.setState({ session: role ? { role, email: `${role}@example.com`, token: 'tok' } : null })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>,
  )
  return router
}

describe('route guards', () => {
  it('a signed-out visitor is sent to login and keeps the page they wanted (returnTo)', async () => {
    const router = renderAt('/classes?tab=2')
    await screen.findByRole('heading', { level: 1 })
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe(`?returnTo=${encodeURIComponent('/classes?tab=2')}`)
  })

  it('the wrong role sees the 403 page', async () => {
    const router = renderAt('/users', 'teacher')
    expect(await screen.findByText(/can.t open this page/i)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/403')
  })

  it('an unknown path shows the not-found page', async () => {
    renderAt('/does-not-exist', 'admin')
    expect(await screen.findByText(/page not found/i)).toBeInTheDocument()
  })
})

describe('student scope', () => {
  it('R-ST1: the student navigation has only Dashboard and Classes', () => {
    expect(navItemsFor('student').map((item) => item.to)).toEqual(['/dashboard', '/classes'])
  })

  it.each(['/tasks', '/settings', '/notifications', '/assign', '/users', '/students', '/integration'])(
    'R-ST1: a student opening %s gets the 403 page',
    async (path) => {
      const router = renderAt(path, 'student')
      expect(await screen.findByText(/can.t open this page/i)).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/403')
    },
  )

  it('R-ST1: assignments are reached through Classes', async () => {
    const router = renderAt('/classes/assignments', 'student')
    await screen.findByRole('main')
    expect(router.state.location.pathname).toBe('/classes/assignments')
  })
})

describe('role navigation', () => {
  it('teachers and admins do not see student pages', () => {
    expect(navItemsFor('teacher').map((item) => item.to)).not.toContain('/classes/assignments')
    expect(navItemsFor('admin').map((item) => item.to)).toEqual(
      expect.arrayContaining(['/students', '/teachers', '/classes', '/subjects', '/users']),
    )
  })

  it('a signed-out visitor sees no navigation', () => {
    expect(navItemsFor(undefined)).toEqual([])
  })
})
