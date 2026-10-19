import type { UserFilters } from '@/features/users/types'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  pending: () => [...userKeys.all, 'pending'] as const,
  roles: () => ['roles'] as const,
  sessions: (userId: number | undefined) => [...userKeys.all, userId, 'sessions'] as const,
}
