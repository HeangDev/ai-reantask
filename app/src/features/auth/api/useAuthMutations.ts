import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { authActions, getSession } from '@/shared/store/authStore'

export const useLogin = () => useMutation({ mutationFn: authApi.login })

export const useGoogleAuth = () => useMutation({ mutationFn: authApi.google })

export const useRegister = () => useMutation({ mutationFn: authApi.register })

export const useForgotPassword = () => useMutation({ mutationFn: authApi.forgotPassword })

export const useLogoutAll = () => useMutation({ mutationFn: authApi.logoutAll })

/**
 * Signs out: the session and every cached query are dropped at once, then this device's token is revoked on
 * the server (best effort; a failure there changes nothing for the user).
 */
export const useSignOut = () =>
  useMutation({
    mutationFn: async () => {
      const token = getSession()?.token
      authActions.signOut()
      if (token) await authApi.logout(token).catch(() => undefined)
    },
  })
