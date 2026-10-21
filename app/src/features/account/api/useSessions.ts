import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSessions, revokeSession } from '@/features/account/api/account.api'
import { userKeys } from '@/features/users'

export const useSessions = (userId: number | undefined) =>
  useQuery({
    queryKey: userKeys.sessions(userId),
    enabled: userId !== undefined,
    queryFn: ({ signal }) => fetchSessions(signal),
  })

/** Logs one device out, then reloads the list so the row disappears. */
export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeSession,
    onSettled: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}
