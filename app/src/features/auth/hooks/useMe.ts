import { useQuery } from '@tanstack/react-query'
import { accountActions } from '@/features/account/store/accountStore'
import { authApi } from '@/features/auth/services/authService'
import { useSession } from '@/features/auth/store/authStore'
import { DEFAULT_AVATAR_URL } from '@/lib/currentUser'

/**
 * The signed-in user from `GET /auth/me`. The result is also copied into the shared profile so the header
 * and the Account page show the same name, email and avatar.
 */
export function useMe() {
  const token = useSession()?.token
  return useQuery({
    queryKey: ['auth', 'me', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const user = await authApi.me()
      accountActions.setProfile({ fullName: user.fullname, email: user.email, avatarUrl: user.avatar ?? DEFAULT_AVATAR_URL })
      return user
    },
  })
}
