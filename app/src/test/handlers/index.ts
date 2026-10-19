import { http, HttpResponse } from 'msw'
import { buildApiUser } from '@/test/factories/user'

export const API = 'http://api.test/api/v1'

// Default responses mirror the API contract; a test overrides one with `server.use()`.
export const handlers = [
  http.get(`${API}/auth/me`, () => HttpResponse.json({ data: buildApiUser() })),
  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${API}/classes`, () =>
    HttpResponse.json({ data: [], meta: { last_page: 1 } }),
  ),
  http.get(`${API}/subjects`, () =>
    HttpResponse.json({ data: [], meta: { last_page: 1 } }),
  ),
]
