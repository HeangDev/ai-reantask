import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userKeys } from '@/features/users/api/users.keys'
import {
  approveUser,
  createUser,
  deleteUser,
  fetchPendingStudents,
  fetchRoles,
  fetchUsers,
  updateUser,
} from '@/features/users/api/users.api'
import type { UserFilters } from '@/features/users/types'

export const useUsersList = (filters: UserFilters, enabled = true) =>
  useQuery({
    queryKey: userKeys.list(filters),
    queryFn: ({ signal }) => fetchUsers(filters, signal),
    placeholderData: keepPreviousData,
    enabled,
  })

export const useRoles = () =>
  useQuery({ queryKey: userKeys.roles(), queryFn: ({ signal }) => fetchRoles(signal), staleTime: 5 * 60_000 })

function useRefreshUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: userKeys.lists() })
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
  useQuery({ queryKey: userKeys.pending(), queryFn: ({ signal }) => fetchPendingStudents(signal), enabled })

/** Approving moves a student out of the pending list and into the users list. */
export function useApproveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approveUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}
