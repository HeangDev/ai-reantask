import { useMutation } from '@tanstack/react-query'
import { changePassword } from '@/features/account/services/accountService'

export const useChangePassword = () => useMutation({ mutationFn: changePassword })
