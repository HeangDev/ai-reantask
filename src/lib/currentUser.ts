export interface CurrentUser {
  fullName: string
  email: string
  avatarUrl: string
}

// Placeholder profile until authentication provides the signed-in user.
export const currentUser: CurrentUser = {
  fullName: 'Sim Kimheang',
  email: 'simkimheang4@gmail.com',
  avatarUrl: '/avatar.svg',
}
