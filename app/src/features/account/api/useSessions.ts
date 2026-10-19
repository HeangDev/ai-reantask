import { useQuery } from '@tanstack/react-query'
import { fetchSessions } from '@/features/account/api/account.api'
import { userKeys } from '@/features/users'

export const useSessions = (userId: number | undefined) =>
  useQuery({
    queryKey: userKeys.sessions(userId),
    enabled: userId !== undefined,
    queryFn: ({ signal }) => fetchSessions(userId as number, signal),
  })
