import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { ApiError } from '@/shared/api/errors'
import { apiRequest } from '@/shared/api/http'
import { queryClient } from '@/shared/api/queryClient'
import { useAuthStore } from '@/shared/store/authStore'
import { API } from '@/test/handlers'
import { server } from '@/test/server'

const itemSchema = z.object({ data: z.object({ id: z.number(), name: z.string() }) })

const signIn = () => useAuthStore.getState().setSession({ role: 'teacher', email: 't@example.com', token: 'secret-token' })

beforeEach(() => {
  useAuthStore.getState().clear()
})

describe('apiRequest', () => {
  it('returns the body parsed with the schema', async () => {
    server.use(http.get(`${API}/things/1`, () => HttpResponse.json({ data: { id: 1, name: 'One' } })))
    await expect(apiRequest('/things/1', { schema: itemSchema })).resolves.toEqual({ data: { id: 1, name: 'One' } })
  })

  it('sends the session token as a bearer header', async () => {
    signIn()
    let header: string | null = null
    server.use(
      http.get(`${API}/things/1`, ({ request }) => {
        header = request.headers.get('Authorization')
        return HttpResponse.json({ data: { id: 1, name: 'One' } })
      }),
    )
    await apiRequest('/things/1', { schema: itemSchema })
    expect(header).toBe('Bearer secret-token')
  })

  it('skips empty query parameters', async () => {
    let url = ''
    server.use(
      http.get(`${API}/things`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ data: { id: 1, name: 'One' } })
      }),
    )
    await apiRequest('/things', { params: { page: 2, search: '', role: undefined }, schema: itemSchema })
    expect(url).toBe(`${API}/things?page=2`)
  })

  it('a response that does not match the schema becomes INVALID_RESPONSE', async () => {
    server.use(http.get(`${API}/things/1`, () => HttpResponse.json({ data: { id: 'not-a-number' } })))
    await expect(apiRequest('/things/1', { schema: itemSchema })).rejects.toMatchObject({
      name: 'ApiError',
      code: 'INVALID_RESPONSE',
    })
  })

  it('a 204 resolves with nothing', async () => {
    server.use(http.delete(`${API}/things/1`, () => new HttpResponse(null, { status: 204 })))
    await expect(apiRequest('/things/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('maps 422 field errors and never exposes the server message', async () => {
    server.use(
      http.post(`${API}/things`, () =>
        HttpResponse.json({ message: 'SQLSTATE[23000] raw detail', errors: { name: ['taken'] } }, { status: 422 }),
      ),
    )
    const error = await apiRequest('/things', { method: 'POST', body: {} }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, messageKey: 'errors.validation', fieldErrors: { name: ['taken'] } })
  })

  it.each([
    [403, 'errors.forbidden'],
    [404, 'errors.notFound'],
    [409, 'errors.conflict'],
    [413, 'errors.fileTooLarge'],
    [429, 'errors.rateLimited'],
    [500, 'errors.server'],
    [418, 'errors.generic'],
  ])('maps status %i to %s', async (status, messageKey) => {
    server.use(http.get(`${API}/things`, () => HttpResponse.json({ message: 'raw' }, { status })))
    await expect(apiRequest('/things')).rejects.toMatchObject({ status, messageKey })
  })

  it('a 429 keeps Retry-After so the UI can count down', async () => {
    server.use(http.get(`${API}/things`, () => HttpResponse.json({}, { status: 429, headers: { 'Retry-After': '30' } })))
    await expect(apiRequest('/things')).rejects.toMatchObject({ status: 429, retryAfter: 30 })
  })

  it('keeps the request id for support', async () => {
    server.use(http.get(`${API}/things`, () => HttpResponse.json({}, { status: 500, headers: { 'X-Request-Id': 'req-9' } })))
    await expect(apiRequest('/things')).rejects.toMatchObject({ requestId: 'req-9' })
  })

  it('a network failure is an ApiError with code NETWORK', async () => {
    server.use(http.get(`${API}/things`, () => HttpResponse.error()))
    await expect(apiRequest('/things')).rejects.toMatchObject({ status: 0, code: 'NETWORK', messageKey: 'errors.network' })
  })

  it('a rejected token ends the session and clears every cached query', async () => {
    signIn()
    queryClient.setQueryData(['cached'], 'student data')
    server.use(http.get(`${API}/things`, () => HttpResponse.json({}, { status: 401 })))

    await expect(apiRequest('/things')).rejects.toMatchObject({ status: 401 })

    expect(useAuthStore.getState().session).toBeNull()
    expect(queryClient.getQueryData(['cached'])).toBeUndefined()
  })

  it('a failed login (no token sent) does not sign anything out', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.json({}, { status: 401 })))
    await expect(apiRequest('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 })
  })
})
