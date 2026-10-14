import { useQuery } from '@tanstack/react-query'
import { fetchSessions } from '@/features/account/services/accountService'

export const useSessions = (userId: number | undefined) =>
  useQuery({
    queryKey: ['users', userId, 'sessions'],
    enabled: userId !== undefined,
    queryFn: () => fetchSessions(userId as number),
  })
