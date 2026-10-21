// Every route path in one typed place (routing.md §3); components never write path strings.
export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  forbidden: '/403',
  dashboard: '/dashboard',
  classes: '/classes',
  /** A teacher's page for one class: its students, subject and assignments. */
  classDetail: (id: string) => `/classes/${id}`,
  /** A student's assignments live under Classes (R-ST1). */
  classAssignments: '/classes/assignments',
  assign: '/assign',
  assignDetail: (id: string) => `/assign/${id}`,
  assignCode: (id: string) => `/assign/${id}/code`,
  tasks: '/tasks',
  students: '/students',
  teachers: '/teachers',
  subjects: '/subjects',
  users: '/users',
  integration: '/integration',
  notifications: '/notifications',
  account: '/account',
  settings: '/settings',
} as const
