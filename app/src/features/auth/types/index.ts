export type Role = 'admin' | 'teacher' | 'student'

export const roles: Role[] = ['teacher', 'student', 'admin']

export interface AuthUser {
  id: number
  fullname: string
  username: string
  email: string
  phone: string
  avatar: string | null
  status: string
  created_at: string
  role: { id: number; name: Role }
}

export interface AuthResult {
  token: string
  token_type: string
  expires_at: string | null
  user: AuthUser
}

export interface LoginInput {
  email: string
  password: string
  /** Shown in the list of signed-in devices. */
  device_name?: string
}

export interface RegisterInput {
  fullname: string
  username: string
  email: string
  phone: string
  password: string
  password_confirmation: string
}
