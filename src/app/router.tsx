import { createBrowserRouter, Navigate } from 'react-router-dom'
import { roleHome } from '@/features/auth/lib/access'
import { useSession } from '@/features/auth/store/authStore'
import MainLayout from '@/components/layout/MainLayout'
import AssignmentsPage from '@/features/assignments/pages/AssignmentsPage'
import CodeEditorPage from '@/features/assignments/pages/CodeEditorPage'
import AssignDetailPage from '@/features/assignments/pages/AssignDetailPage'
import AssignPage from '@/features/assignments/pages/AssignPage'
import TasksPage from '@/features/tasks/pages/TasksPage'
import SettingsPage from '@/features/settings/pages/SettingsPage'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import StudentsPage from '@/features/students/pages/StudentsPage'
import TeachersPage from '@/features/teachers/pages/TeachersPage'
import UsersPage from '@/features/users/pages/UsersPage'
import NotificationsPage from '@/features/notifications/pages/NotificationsPage'
import AccountPage from '@/features/account/pages/AccountPage'
import ClassesPage from '@/features/classes/pages/ClassesPage'
import SubjectsPage from '@/features/subjects/pages/SubjectsPage'
import StudentClassesPage from '@/features/classes/pages/StudentClassesPage'
import IntegrationsPage from '@/features/integrations/pages/IntegrationsPage'
import LoginPage from '@/features/auth/pages/LoginPage'

// The layout only lets a signed-in user reach this, so it can send each role to its own start page.
function HomeRedirect() {
  const session = useSession()
  return <Navigate to={session ? roleHome[session.role] : '/login'} replace />
}

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomeRedirect /> },
      { path: '/assignments', element: <AssignmentsPage />, handle: { titleKey: 'nav.assignments' } },
      { path: '/my-classes', element: <StudentClassesPage />, handle: { titleKey: 'nav.myClasses' } },
      { path: '/assign', element: <AssignPage />, handle: { titleKey: 'nav.assign' } },
      { path: '/assign/:id', element: <AssignDetailPage />, handle: { titleKey: 'nav.assign' } },
      { path: '/assign/:id/code', element: <CodeEditorPage />, handle: { titleKey: 'nav.assign' } },
      { path: '/tasks', element: <TasksPage />, handle: { titleKey: 'nav.tasks' } },
      { path: '/dashboard', element: <DashboardPage />, handle: { titleKey: 'nav.dashboard' } },
      { path: '/students', element: <StudentsPage />, handle: { titleKey: 'nav.students' } },
      { path: '/teachers', element: <TeachersPage />, handle: { titleKey: 'nav.teachers' } },
      { path: '/classes', element: <ClassesPage />, handle: { titleKey: 'nav.classes' } },
      { path: '/subjects', element: <SubjectsPage />, handle: { titleKey: 'nav.subjects' } },
      { path: '/users', element: <UsersPage />, handle: { titleKey: 'nav.users' } },
      { path: '/integration', element: <IntegrationsPage />, handle: { titleKey: 'nav.integration' } },
      { path: '/notifications', element: <NotificationsPage />, handle: { titleKey: 'header.notifications' } },
      { path: '/account', element: <AccountPage />, handle: { titleKey: 'header.accountSettings' } },
      { path: '/settings', element: <SettingsPage />, handle: { titleKey: 'nav.settings' } },
    ],
  },
  { path: '/login', element: <LoginPage />, handle: { titleKey: 'nav.login' } },
])
