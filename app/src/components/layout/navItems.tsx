import type { ReactNode } from 'react'
import {
  AssignmentsIcon,
  ClassIcon,
  ClipboardListIcon,
  DashboardIcon,
  IntegrationIcon,
  ReportIcon,
  StudentsIcon,
  SubjectIcon,
  TeachersIcon,
  UsersIcon,
} from '@/components/ui/icons'
import type { Role } from '@/features/auth/types'
import type { TranslationKey } from '@/lib/i18n'

export interface NavItem {
  to: string
  labelKey: TranslationKey
  icon: ReactNode
  /** Roles that see this item. */
  roles: Role[]
}

// Main navigation, shared by the sidebar and the global search.
export const navItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: <DashboardIcon />, roles: ['admin', 'teacher', 'student'] },
  { to: '/assignments', labelKey: 'nav.assignments', icon: <AssignmentsIcon />, roles: ['student'] },
  { to: '/my-classes', labelKey: 'nav.myClasses', icon: <ClassIcon />, roles: ['student'] },
  { to: '/assign', labelKey: 'nav.assign', icon: <ClipboardListIcon />, roles: ['teacher'] },
  { to: '/students', labelKey: 'nav.students', icon: <StudentsIcon />, roles: ['admin', 'teacher'] },
  { to: '/teachers', labelKey: 'nav.teachers', icon: <TeachersIcon />, roles: ['admin'] },
  { to: '/reports/scores', labelKey: 'nav.scoreReport', icon: <ReportIcon />, roles: ['teacher'] },
  { to: '/classes', labelKey: 'nav.classes', icon: <ClassIcon />, roles: ['admin', 'teacher'] },
  { to: '/subjects', labelKey: 'nav.subjects', icon: <SubjectIcon />, roles: ['admin'] },
  { to: '/users', labelKey: 'nav.users', icon: <UsersIcon />, roles: ['admin'] },
]

// Shown in the sidebar's bottom group (after Settings); still searchable like the main items.
export const integrationNavItem: NavItem = {
  to: '/integration',
  labelKey: 'nav.integration',
  icon: <IntegrationIcon />,
  roles: ['teacher'],
}

/** The main navigation for one role. */
export const navItemsFor = (role: Role | undefined) => navItems.filter((item) => role !== undefined && item.roles.includes(role))
