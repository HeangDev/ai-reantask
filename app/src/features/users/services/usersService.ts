import { getSession } from '@/features/auth/store/authStore'
import type { AuthUser, Role } from '@/features/auth/types'
import type { RoleOption, User, UserFilters, UserSaveInput, UsersPage } from '@/features/users/types'
import { apiRequest } from '@/lib/apiClient'

interface ApiRole {
  id: number
  name: Role
  status: string
}

const toUser = (u: AuthUser): User => ({
  id: String(u.id),
  fullName: u.fullname,
  username: u.username,
  email: u.email,
  phone: u.phone ?? '',
  role: u.role.name,
  roleId: u.role.id,
  status: u.status as User['status'],
  createdAt: Date.parse(u.created_at),
})

const token = () => getSession()?.token

/**
 * One page of users matching the filters. The API cannot sort by id, so they are sorted by `created_at`
 * ascending, which with its id tie-break is id order.
 */
export async function fetchUsers(filters: UserFilters): Promise<UsersPage> {
  const params = new URLSearchParams({
    per_page: String(filters.perPage),
    page: String(filters.page),
    sort: 'created_at',
  })
  if (filters.search.trim()) params.set('search', filters.search.trim())
  if (filters.role) params.set('role', filters.role)
  if (filters.status) params.set('status', filters.status)
  const { data, meta } = await apiRequest<{ data: AuthUser[]; meta: { total: number } }>(`/users?${params}`, {
    token: token(),
  })
  return { users: data.map(toUser), total: meta.total }
}

export async function fetchRoles(): Promise<RoleOption[]> {
  const { data } = await apiRequest<{ data: ApiRole[] }>('/roles?per_page=100', { token: token() })
  return data.map((r) => ({ id: r.id, name: r.name }))
}

export const createUser = async (input: UserSaveInput): Promise<User> => {
  const { data } = await apiRequest<{ data: AuthUser }>('/users', {
    method: 'POST',
    token: token(),
    body: {
      fullname: input.fullName,
      username: input.username,
      email: input.email,
      phone: input.phone,
      password: input.password,
      password_confirmation: input.password,
      role_id: Number(input.roleId),
      status: input.status,
    },
  })
  return toUser(data)
}

/** Sends only what changed, because an admin may not send `role_id` or `status` for their own account. */
export const updateUser = async ({ user, input }: { user: User; input: UserSaveInput }): Promise<User> => {
  const body: Record<string, unknown> = {}
  if (input.fullName !== user.fullName) body.fullname = input.fullName
  if (input.username !== user.username) body.username = input.username
  if (input.email !== user.email) body.email = input.email
  if (input.phone !== user.phone) body.phone = input.phone
  if (Number(input.roleId) !== user.roleId) body.role_id = Number(input.roleId)
  if (input.status !== user.status) body.status = input.status
  const { data } = await apiRequest<{ data: AuthUser }>(`/users/${user.id}`, { method: 'PATCH', token: token(), body })
  return toUser(data)
}

export const deleteUser = (id: string) => apiRequest<void>(`/users/${id}`, { method: 'DELETE', token: token() })

/** Students who registered and wait for approval, oldest first (one page of up to 100). */
export async function fetchPendingStudents(): Promise<User[]> {
  const { data } = await apiRequest<{ data: AuthUser[] }>('/users/pending-students?per_page=100', { token: token() })
  return data.map(toUser)
}

/** Makes a PENDING student ACTIVE, so they can sign in. */
export const approveUser = async (id: string): Promise<User> => {
  const { data } = await apiRequest<{ data: AuthUser }>(`/users/${id}/approve`, { method: 'POST', token: token() })
  return toUser(data)
}
