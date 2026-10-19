export const roles = ['teacher', 'student', 'admin'] as const

export type Role = (typeof roles)[number]
