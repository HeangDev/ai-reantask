export type AccountStatus = 'active' | 'inactive'

export interface User {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
  status: AccountStatus
  /** ISO date of the last login; recorded by the system, so absent for a user who never signed in. */
  lastLogin?: string
}

// Last login is not entered by hand.
export type UserInput = Omit<User, 'id' | 'lastLogin'>

export type UserErrorKey = 'usr.errName' | 'tch.errEmailTaken' | 'stu.errEmail' | 'stu.errPhone' | 'usr.errEmailTaken' | 'usr.errRole'

export type UserFormErrors = Partial<Record<keyof UserInput, UserErrorKey>>
