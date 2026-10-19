import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useSignOut } from '@/features/auth/api/useAuthMutations'
import { queryClient } from '@/shared/api/queryClient'
import { useAuthStore } from '@/shared/store/authStore'
import { API } from '@/test/handlers'
import { renderHookWithQuery } from '@/test/renderHookWithQuery'
import { server } from '@/test/server'

describe('useSignOut', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession({ role: 'student', email: 's@example.com', token: 'old-token' })
    queryClient.setQueryData(['classes'], ['private'])
  })

  it('drops the session and cached data at once, then revokes the old token on the server', async () => {
    let header: string | null = null
    server.use(
      http.post(`${API}/auth/logout`, ({ request }) => {
        header = request.headers.get('Authorization')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { result } = renderHookWithQuery(() => useSignOut())

    act(() => result.current.mutate())

    await waitFor(() => expect(useAuthStore.getState().session).toBeNull())
    expect(queryClient.getQueryData(['classes'])).toBeUndefined()
    await waitFor(() => expect(header).toBe('Bearer old-token'))
  })

  it('still signs out when the server cannot be reached', async () => {
    server.use(http.post(`${API}/auth/logout`, () => HttpResponse.error()))
    const { result } = renderHookWithQuery(() => useSignOut())

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(useAuthStore.getState().session).toBeNull()
    expect(result.current.isError).toBe(false)
  })
})
