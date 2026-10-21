import { http, HttpResponse } from 'msw'
import type { AuthUser } from '@/features/auth'
import { buildApiUser } from '@/test/factories/user'

export const API = 'http://api.test/api/v1'

/** A user as the API sends it (`UserResponse`). */
export const toApiShape = (u: AuthUser) => ({
  id: u.id,
  roleId: u.role.id,
  roleName: u.role.name.toUpperCase(),
  fullname: u.fullname,
  email: u.email,
  phone: u.phone,
  avatar: u.avatar,
  status: u.status,
  createdAt: u.created_at,
})

// Default responses mirror the API contract; a test overrides one with `server.use()`.
export const handlers = [
  http.get(`${API}/users/me`, () => HttpResponse.json({ data: toApiShape(buildApiUser()) })),
  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${API}/classes`, () =>
    HttpResponse.json({ data: [], meta: { last_page: 1 } }),
  ),
  http.get(`${API}/subjects`, () =>
    HttpResponse.json({ data: [], meta: { last_page: 1 } }),
  ),
]
