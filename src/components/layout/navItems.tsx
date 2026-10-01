import type { ReactNode } from 'react'
import {
  AssignmentsIcon,
  ClipboardListIcon,
  DashboardIcon,
  RolesIcon,
  StudentsIcon,
  TeachersIcon,
  UsersIcon,
} from '@/components/ui/icons'
import type { TranslationKey } from '@/lib/i18n'

export interface NavItem {
  to: string
  labelKey: TranslationKey
  icon: ReactNode
}

// Main navigation, shared by the sidebar and the global search.
export const navItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: <DashboardIcon /> },
  { to: '/assignments', labelKey: 'nav.assignments', icon: <AssignmentsIcon /> },
  { to: '/assign', labelKey: 'nav.assign', icon: <ClipboardListIcon /> },
  { to: '/students', labelKey: 'nav.students', icon: <StudentsIcon /> },
  { to: '/teachers', labelKey: 'nav.teachers', icon: <TeachersIcon /> },
  { to: '/users', labelKey: 'nav.users', icon: <UsersIcon /> },
  { to: '/roles', labelKey: 'nav.roles', icon: <RolesIcon /> },
]
