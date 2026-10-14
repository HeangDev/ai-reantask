import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveUser, createUser, deleteUser, fetchPendingStudents, fetchRoles, fetchUsers, updateUser } from '@/features/users/services/usersService'
import type { UserFilters } from '@/features/users/types'

export const useUsersList = (filters: UserFilters, enabled = true) =>
  useQuery({
    queryKey: ['users', 'list', filters],
    queryFn: () => fetchUsers(filters),
    placeholderData: keepPreviousData,
    enabled,
  })

export const useRoles = () => useQuery({ queryKey: ['roles'], queryFn: fetchRoles, staleTime: 5 * 60_000 })

function useRefreshUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
}

export function useCreateUser() {
  const refresh = useRefreshUsers()
  return useMutation({ mutationFn: createUser, onSuccess: refresh })
}

export function useUpdateUser() {
  const refresh = useRefreshUsers()
  return useMutation({ mutationFn: updateUser, onSuccess: refresh })
}

/** Deletes every id; if some fail the others are still deleted and the mutation reports an error. */
export function useDeleteUsers() {
  const refresh = useRefreshUsers()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map(deleteUser))
      const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (failed) throw failed.reason
    },
    onSettled: refresh,
  })
}

export const usePendingStudents = (enabled: boolean) =>
  useQuery({ queryKey: ['users', 'pending'], queryFn: fetchPendingStudents, enabled })

/** Approving moves a student out of the pending list and into the users list. */
export function useApproveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approveUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
