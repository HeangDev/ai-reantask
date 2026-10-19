import { useMemo } from 'react'
import { useMe } from '@/features/auth/api/useMe'
import { DEFAULT_AVATAR_URL, currentUser } from '@/shared/lib/currentUser'
import type { CurrentUser } from '@/shared/lib/currentUser'
import { useProfileStore } from '@/shared/store/profileStore'

/**
 * The signed-in user's name, email and avatar: the server's `/auth/me` answer, with any edits made on the
 * Account page on top. Server data stays in TanStack Query; only the edits live in a store.
 */
export function useProfile(): CurrentUser {
  const me = useMe().data
  const overrides = useProfileStore((s) => s.overrides)
  return useMemo(
    () => ({
      fullName: overrides.fullName ?? me?.fullname ?? currentUser.fullName,
      email: me?.email ?? currentUser.email,
      avatarUrl: overrides.avatarUrl ?? me?.avatar ?? DEFAULT_AVATAR_URL,
    }),
    [me, overrides],
  )
}
