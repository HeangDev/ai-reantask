import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { I18nProvider } from '@/shared/i18n'
import { ToastProvider } from '@/shared/components/Toast'
import { useAuthStore } from '@/shared/store/authStore'
import type { Session } from '@/shared/store/authStore'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** The URL the router starts at. */
  route?: string
  /** Signs this session in before rendering. */
  auth?: Session
}

/**
 * Renders with a fresh query client, the English i18n instance, toasts and a memory data router
 * (some components need a data router for `useMatches`, `useBlocker` and loaders).
 */
export function renderWithProviders(ui: ReactElement, { route = '/', auth, ...options }: Options = {}) {
  useAuthStore.setState({ session: auth ?? null })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [route] })

  return {
    queryClient,
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </I18nProvider>
      </QueryClientProvider>,
      options,
    ),
  }
}
