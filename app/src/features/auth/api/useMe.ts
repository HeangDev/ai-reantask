import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { authKeys } from '@/features/auth/api/auth.keys'
import { useSession } from '@/shared/store/authStore'

/** The signed-in user from `GET /auth/me`. */
export function useMe() {
  const token = useSession()?.token
  return useQuery({
    queryKey: authKeys.me(token),
    enabled: Boolean(token),
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 5 * 60_000,
  })
}
