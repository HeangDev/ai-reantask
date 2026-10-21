import { queryClient } from '@/shared/api/queryClient'
import { authActions, getSession, useAuthStore } from '@/shared/store/authStore'
import { useProfileStore } from '@/shared/store/profileStore'
import { getTwoFactorSecret, useTwoFactorStore } from '@/shared/store/twoFactorStore'

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  useAuthStore.getState().clear()
})

describe('authStore', () => {
  it('stores the session with a lower-cased email', () => {
    authActions.signIn('teacher', ' Teacher@Example.COM ', 'tok')
    expect(getSession()).toEqual({ role: 'teacher', email: 'teacher@example.com', token: 'tok' })
  })

  it('security: the session is kept in sessionStorage only, never in localStorage', () => {
    authActions.signIn('student', 's@example.com', 'super-secret-token')
    expect(window.sessionStorage.getItem('session')).toContain('super-secret-token')
    expect(window.localStorage.length).toBe(0)
  })

  it('a reload restores the saved session', async () => {
    window.sessionStorage.setItem('session', JSON.stringify({ role: 'admin', email: 'a@example.com', token: 'tok' }))
    jest.resetModules()
    const fresh = await import('@/shared/store/authStore')
    expect(fresh.getSession()).toEqual({ role: 'admin', email: 'a@example.com', token: 'tok' })
  })

  it('ignores a saved session that is damaged or has an unknown role', async () => {
    window.sessionStorage.setItem('session', JSON.stringify({ role: 'hacker', email: 'a@example.com', token: 'tok' }))
    jest.resetModules()
    expect((await import('@/shared/store/authStore')).getSession()).toBeNull()
    window.sessionStorage.setItem('session', '{not json')
    jest.resetModules()
    expect((await import('@/shared/store/authStore')).getSession()).toBeNull()
  })

  it('logout clears the session, the stores and every cached query', () => {
    authActions.signIn('student', 's@example.com', 'tok')
    useProfileStore.getState().update({ fullName: 'Edited Name' })
    useTwoFactorStore.getState().enable('SECRET')
    queryClient.setQueryData(['classes'], ['class a'])

    authActions.signOut()

    expect(getSession()).toBeNull()
    expect(window.sessionStorage.getItem('session')).toBeNull()
    expect(useProfileStore.getState().overrides).toEqual({})
    expect(getTwoFactorSecret()).toBeNull()
    expect(queryClient.getQueryData(['classes'])).toBeUndefined()
  })
})
