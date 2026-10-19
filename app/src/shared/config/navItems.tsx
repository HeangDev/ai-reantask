import type { ReactNode } from 'react'
import {
  ClassIcon,
  ClipboardListIcon,
  DashboardIcon,
  IntegrationIcon,
  ReportIcon,
  StudentsIcon,
  SubjectIcon,
  TeachersIcon,
  UsersIcon,
} from '@/shared/components/icons'
import type { Role } from '@/shared/types/auth'
import type { TranslationKey } from '@/shared/i18n'
import { paths } from '@/shared/config/paths'

export interface NavItem {
  to: string
  labelKey: TranslationKey
  icon: ReactNode
  /** Roles that see this item. */
  roles: Role[]
}

// Main navigation, shared by the sidebar and the global search.
export const navItems: NavItem[] = [
  { to: paths.dashboard, labelKey: 'nav.dashboard', icon: <DashboardIcon />, roles: ['admin', 'teacher', 'student'] },
  { to: paths.classes, labelKey: 'nav.myClasses', icon: <ClassIcon />, roles: ['student'] },
  { to: paths.assign, labelKey: 'nav.assign', icon: <ClipboardListIcon />, roles: ['teacher'] },
  { to: paths.students, labelKey: 'nav.students', icon: <StudentsIcon />, roles: ['admin'] },
  { to: paths.teachers, labelKey: 'nav.teachers', icon: <TeachersIcon />, roles: ['admin'] },
  { to: paths.scoreReport, labelKey: 'nav.scoreReport', icon: <ReportIcon />, roles: ['teacher'] },
  { to: paths.classes, labelKey: 'nav.classes', icon: <ClassIcon />, roles: ['admin', 'teacher'] },
  { to: paths.subjects, labelKey: 'nav.subjects', icon: <SubjectIcon />, roles: ['admin'] },
  { to: paths.users, labelKey: 'nav.users', icon: <UsersIcon />, roles: ['admin'] },
]

// Shown in the sidebar's bottom group (after Settings); still searchable like the main items.
export const integrationNavItem: NavItem = {
  to: paths.integration,
  labelKey: 'nav.integration',
  icon: <IntegrationIcon />,
  roles: ['teacher'],
}

/** The main navigation for one role. */
export const navItemsFor = (role: Role | undefined) => navItems.filter((item) => role !== undefined && item.roles.includes(role))
