import type { Role } from '@/features/auth'

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export const accountStatuses: AccountStatus[] = ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED']

export interface User {
  /** The API's numeric id, as a string because tables select rows by string id. */
  id: string
  fullName: string
  username: string
  email: string
  phone: string
  /** The avatar URL the API stores; sent back unchanged when an admin edits the user. */
  avatar: string | null
  role: Role
  roleId: number
  status: AccountStatus
  /** Epoch milliseconds of registration. */
  createdAt: number
}

/** What the form edits. `roleId` is a string because the dropdown works with strings; an empty string means none chosen. */
export interface UserInput {
  fullName: string
  username: string
  email: string
  phone: string
  roleId: string
  status: AccountStatus
}

/** A new user also needs a password. */
export interface UserSaveInput extends UserInput {
  password?: string
}

export interface RoleOption {
  id: number
  name: Role
}

export interface UserFilters {
  search: string
  role: '' | Role
  status: '' | AccountStatus
  /** One-based page number. */
  page: number
  perPage: number
}

export interface UsersPage {
  users: User[]
  total: number
}

export type UserErrorKey =
  | 'usr.errName'
  | 'tch.errEmailTaken'
  | 'stu.errEmail'
  | 'stu.errPhone'
  | 'usr.errEmailTaken'
  | 'usr.errRole'
  | 'register.errPhoneTaken'
  | 'acct.errPasswordRule'
  | 'acct.errPasswordMatch'

export type UserFormErrors = Partial<Record<keyof UserInput | 'password' | 'confirm', UserErrorKey>>
