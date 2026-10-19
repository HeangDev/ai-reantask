import { useMutation } from '@tanstack/react-query'
import { changePassword } from '@/features/account/api/account.api'

export const useChangePassword = () => useMutation({ mutationFn: changePassword })
