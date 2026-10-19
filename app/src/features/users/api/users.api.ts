import type { AuthUser } from '@/features/auth'
import { rolesSchema, userEnvelope, usersListSchema, usersPageSchema } from '@/features/users/schemas/user.schemas'
import type { RoleOption, User, UserFilters, UserSaveInput, UsersPage } from '@/features/users/types'
import { apiRequest } from '@/shared/api/http'

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

/**
 * One page of users matching the filters. The API cannot sort by id, so they are sorted by `created_at`
 * ascending, which with its id tie-break is id order.
 */
export async function fetchUsers(filters: UserFilters, signal?: AbortSignal): Promise<UsersPage> {
  const { data, meta } = await apiRequest('/users', {
    params: {
      per_page: filters.perPage,
      page: filters.page,
      sort: 'created_at',
      search: filters.search.trim(),
      role: filters.role,
      status: filters.status,
    },
    signal,
    schema: usersPageSchema,
  })
  return { users: data.map(toUser), total: meta.total }
}

export async function fetchRoles(signal?: AbortSignal): Promise<RoleOption[]> {
  const { data } = await apiRequest('/roles', { params: { per_page: 100 }, signal, schema: rolesSchema })
  return data.map((r) => ({ id: r.id, name: r.name }))
}

export const createUser = async (input: UserSaveInput): Promise<User> => {
  const { data } = await apiRequest('/users', {
    method: 'POST',
    schema: userEnvelope,
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
  const { data } = await apiRequest(`/users/${user.id}`, { method: 'PATCH', body, schema: userEnvelope })
  return toUser(data)
}

export const deleteUser = (id: string) => apiRequest(`/users/${id}`, { method: 'DELETE' })

/** Students who registered and wait for approval, oldest first (one page of up to 100). */
export async function fetchPendingStudents(signal?: AbortSignal): Promise<User[]> {
  const { data } = await apiRequest('/users/pending-students', {
    params: { per_page: 100 },
    signal,
    schema: usersListSchema,
  })
  return data.map(toUser)
}

/** Makes a PENDING student ACTIVE, so they can sign in. */
export const approveUser = async (id: string): Promise<User> => {
  const { data } = await apiRequest(`/users/${id}/approve`, { method: 'POST', schema: userEnvelope })
  return toUser(data)
}
