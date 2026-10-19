import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import { Route, Routes, useLocation } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { useAuthStore } from '@/shared/store/authStore'
import { API } from '@/test/handlers'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Where />} />
    </Routes>,
    { route: '/login' },
  )
}

const authResult = (role: 'student' | 'teacher' | 'admin') => ({
  data: {
    token: 'tok-123',
    token_type: 'Bearer',
    expires_at: null,
    user: {
      id: 1,
      fullname: 'Sok Dara',
      username: 'sokdara',
      email: 'Sok@Example.com',
      phone: null,
      avatar: null,
      status: 'ACTIVE',
      created_at: '2026-01-01T00:00:00Z',
      role: { id: 1, name: role },
    },
  },
})

describe('LoginPage', () => {
  it('shows an error for each empty field and sends nothing (forms-validation.md §6.1)', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeEnabled()
  })

  it('a successful sign-in keeps the session in memory and goes to the dashboard', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.json(authResult('teacher'))))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'sok@example.com')
    await user.type(screen.getByLabelText('Password'), 'Passw0rd!')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/dashboard'))
    expect(useAuthStore.getState().session).toEqual({ role: 'teacher', email: 'sok@example.com', token: 'tok-123' })
  })

  it('sends the typed credentials and a device name', async () => {
    let body: unknown
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(authResult('student'))
      }),
    )
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'Passw0rd!')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => expect(body).toMatchObject({ email: 'a@b.co', password: 'Passw0rd!' }))
    expect(body).toHaveProperty('device_name')
  })

  it('wrong details show a generic error and never the server message', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.json({ message: 'raw server text' }, { status: 401 })))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t sign you in')
    expect(screen.queryByText(/raw server text/)).not.toBeInTheDocument()
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('an account that is waiting for approval gets its own message', async () => {
    server.use(
      http.post(`${API}/auth/login`, () => HttpResponse.json({ message: 'pending', code: 'ACCOUNT_PENDING' }, { status: 403 })),
    )
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'Passw0rd!')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText('Account waiting for approval')).toBeInTheDocument()
  })

  it('a11y: has no axe violations', async () => {
    const { container } = renderLogin()
    expect(await axe(container)).toHaveNoViolations()
  })
})
