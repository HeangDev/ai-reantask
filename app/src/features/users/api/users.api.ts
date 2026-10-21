import type { AuthUser } from '@/features/auth'
import { rolesSchema, userEnvelope, usersPageSchema } from '@/features/users/schemas/user.schemas'
import { userKeys } from '@/features/users/api/users.keys'
import type { RoleOption, User, UserFilters, UserSaveInput, UsersPage } from '@/features/users/types'
import { apiRequest } from '@/shared/api/http'
import { queryClient } from '@/shared/api/queryClient'

const toUser = (u: AuthUser): User => ({
  id: String(u.id),
  fullName: u.fullname,
  username: u.username,
  email: u.email,
  phone: u.phone ?? '',
  avatar: u.avatar,
  role: u.role.name,
  roleId: u.role.id,
  status: u.status as User['status'],
  createdAt: Date.parse(u.created_at),
})

export async function fetchRoles(signal?: AbortSignal): Promise<RoleOption[]> {
  const { data } = await apiRequest('/roles', { params: { size: 100 }, signal, schema: rolesSchema })
  return data.items.map((r) => ({ id: r.id, name: r.name }))
}

/** The API filters by role id, the screens by role name. Only admins may list roles; others get no role filter. */
async function roleIdFor(role: UserFilters['role']): Promise<number | undefined> {
  if (!role) return undefined
  try {
    const roles = await queryClient.query({ queryKey: userKeys.roles(), queryFn: ({ signal }) => fetchRoles(signal), staleTime: 5 * 60_000 })
    return roles.find((r) => r.name === role)?.id
  } catch {
    return undefined
  }
}

/** One page of users matching the filters, oldest first (so the order is stable while paging). */
export async function fetchUsers(filters: UserFilters, signal?: AbortSignal): Promise<UsersPage> {
  const { data } = await apiRequest('/users', {
    params: {
      size: filters.perPage,
      page: filters.page - 1, // the API's pages start at 0
      sort: 'createdAt,asc',
      q: filters.search.trim(),
      roleId: await roleIdFor(filters.role),
      status: filters.status,
    },
    signal,
    schema: usersPageSchema,
  })
  return { users: data.items.map(toUser), total: data.totalItems }
}

/** Changes the status through its own endpoint, because create and update do not take one. */
const setStatus = async (id: string, status: User['status']): Promise<User> => {
  const { data } = await apiRequest(`/users/${id}/status`, { method: 'PATCH', body: { status }, schema: userEnvelope })
  return toUser(data)
}

/** The API creates every admin-made account as ACTIVE; any other status is set right after. */
export const createUser = async (input: UserSaveInput): Promise<User> => {
  const { data } = await apiRequest('/users', {
    method: 'POST',
    schema: userEnvelope,
    body: {
      roleId: Number(input.roleId),
      fullname: input.fullName,
      email: input.email,
      phone: input.phone,
      password: input.password,
    },
  })
  const created = toUser(data)
  return input.status === 'INACTIVE' || input.status === 'SUSPENDED' ? setStatus(created.id, input.status) : created
}

/** The email cannot be changed. The API takes the whole profile, so the avatar is sent back as it was. */
export const updateUser = async ({ user, input }: { user: User; input: UserSaveInput }): Promise<User> => {
  const { data } = await apiRequest(`/users/${user.id}`, {
    method: 'PUT',
    schema: userEnvelope,
    body: {
      roleId: Number(input.roleId),
      fullname: input.fullName,
      phone: input.phone || null,
      avatar: user.avatar,
    },
  })
  const updated = toUser(data)
  return input.status === user.status ? updated : setStatus(user.id, input.status)
}

export const deleteUser = (id: string) => apiRequest(`/users/${id}`, { method: 'DELETE' })

/** Students who registered and wait for approval, oldest first (one page of up to 100). */
export async function fetchPendingStudents(signal?: AbortSignal): Promise<User[]> {
  const { data } = await apiRequest('/users', {
    params: { status: 'PENDING', size: 100, sort: 'createdAt,asc' },
    signal,
    schema: usersPageSchema,
  })
  return data.items.map(toUser)
}

/** Declines a registration: the account is suspended (not deleted), so it can still be reactivated from the list. */
export const rejectUser = (id: string): Promise<User> => setStatus(id, 'SUSPENDED')

/** Makes a PENDING student ACTIVE, so they can sign in. */
export const approveUser = async (id: string): Promise<User> => {
  const { data } = await apiRequest(`/users/${id}/approve`, { method: 'PATCH', schema: userEnvelope })
  return toUser(data)
}
