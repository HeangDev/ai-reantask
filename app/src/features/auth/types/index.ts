export { roles } from '@/shared/types/auth'
export type { Role } from '@/shared/types/auth'

export type { AuthResult, AuthUser } from '@/features/auth/schemas/auth.schemas'

export interface LoginInput {
  email: string
  password: string
  /** Shown in the list of signed-in devices. */
  device_name?: string
}

export interface GoogleAuthInput {
  /** The Google ID token from Google Identity Services. */
  credential: string
  device_name?: string
}

export interface RegisterInput {
  fullname: string
  email: string
  phone: string
  password: string
}
