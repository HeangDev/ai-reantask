export interface CurrentUser {
  fullName: string
  email: string
  avatarUrl: string
}

export const DEFAULT_AVATAR_URL = '/avatar.svg'

// Placeholder profile until authentication provides the signed-in user.
export const currentUser: CurrentUser = {
  fullName: 'Sim Kimheang',
  email: 'simkimheang4@gmail.com',
  avatarUrl: DEFAULT_AVATAR_URL,
}
