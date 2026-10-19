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

  it('security: the token is never written to localStorage or sessionStorage', () => {
    authActions.signIn('student', 's@example.com', 'super-secret-token')
    const everything = JSON.stringify({ ...window.localStorage }) + JSON.stringify({ ...window.sessionStorage })
    expect(everything).not.toContain('super-secret-token')
    expect(window.sessionStorage.length).toBe(0)
    expect(window.localStorage.length).toBe(0)
  })

  it('logout clears the session, the stores and every cached query', () => {
    authActions.signIn('student', 's@example.com', 'tok')
    useProfileStore.getState().update({ fullName: 'Edited Name' })
    useTwoFactorStore.getState().enable('SECRET')
    queryClient.setQueryData(['classes'], ['class a'])

    authActions.signOut()

    expect(getSession()).toBeNull()
    expect(useProfileStore.getState().overrides).toEqual({})
    expect(getTwoFactorSecret()).toBeNull()
    expect(queryClient.getQueryData(['classes'])).toBeUndefined()
  })
})
