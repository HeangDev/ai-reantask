import type { User } from '@/features/users/types'

// Placeholder data until a users API is documented in docs/api.md.
// The role list will come from the Roles feature once it exists.
export const userRoles = ['Admin', 'Teacher', 'Student', 'Staff']

export const sampleUsers: User[] = [
  { id: '1', fullName: 'Sim Kimheang', email: 'simkimheang4@gmail.com', phone: '+855 12 111 001', role: 'Admin', status: 'active', lastLogin: '2026-10-01' },
  { id: '2', fullName: 'Vireak Sok', email: 'vireak.sok@example.com', phone: '+855 12 700 101', role: 'Teacher', status: 'active', lastLogin: '2026-09-30' },
  { id: '3', fullName: 'Sopheap Chea', email: 'sopheap.chea@example.com', phone: '+855 15 700 202', role: 'Teacher', status: 'active', lastLogin: '2026-09-29' },
  { id: '4', fullName: 'Sokha Chan', email: 'sokha.chan@example.com', phone: '+855 12 345 678', role: 'Student', status: 'active', lastLogin: '2026-09-29' },
  { id: '5', fullName: 'Dara Kim', email: 'dara.kim@example.com', phone: '+855 15 222 811', role: 'Student', status: 'active', lastLogin: '2026-09-30' },
  { id: '6', fullName: 'Vanna Pich', email: 'vanna.pich@example.com', phone: '+855 17 908 450', role: 'Student', status: 'inactive', lastLogin: '2026-08-12' },
  { id: '7', fullName: 'Chanthy Roeun', email: 'chanthy.roeun@example.com', phone: '+855 93 118 205', role: 'Staff', status: 'active', lastLogin: '2026-09-27' },
  { id: '8', fullName: 'Kosal Nhem', email: 'kosal.nhem@example.com', phone: '+855 88 700 707', role: 'Teacher', status: 'inactive' },
  { id: '9', fullName: 'Bopha Sen', email: 'bopha.sen@example.com', phone: '+855 81 530 377', role: 'Staff', status: 'active', lastLogin: '2026-10-01' },
]
