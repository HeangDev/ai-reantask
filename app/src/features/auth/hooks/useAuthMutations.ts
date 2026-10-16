import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/services/authService'

export const useLogin = () => useMutation({ mutationFn: authApi.login })

export const useGoogleAuth = () => useMutation({ mutationFn: authApi.google })

export const useRegister = () => useMutation({ mutationFn: authApi.register })

export const useForgotPassword = () => useMutation({ mutationFn: authApi.forgotPassword })

export const useLogoutAll = () => useMutation({ mutationFn: authApi.logoutAll })
