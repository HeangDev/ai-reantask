import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import AssignmentsPage from '@/features/assignments/pages/AssignmentsPage'
import CodeEditorPage from '@/features/assignments/pages/CodeEditorPage'
import AssignDetailPage from '@/features/assignments/pages/AssignDetailPage'
import AssignPage from '@/features/assignments/pages/AssignPage'
import TasksPage from '@/features/tasks/pages/TasksPage'
import SettingsPage from '@/features/settings/pages/SettingsPage'
import PlaceholderPage from '@/components/ui/PlaceholderPage'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import StudentsPage from '@/features/students/pages/StudentsPage'
import TeachersPage from '@/features/teachers/pages/TeachersPage'
import UsersPage from '@/features/users/pages/UsersPage'
import LoginPage from '@/features/auth/pages/LoginPage'

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Navigate to="/assignments" replace /> },
      { path: '/assignments', element: <AssignmentsPage /> },
      { path: '/assign', element: <AssignPage /> },
      { path: '/assign/:id', element: <AssignDetailPage /> },
      { path: '/assign/:id/code', element: <CodeEditorPage /> },
      { path: '/tasks', element: <TasksPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/students', element: <StudentsPage /> },
      { path: '/teachers', element: <TeachersPage /> },
      { path: '/users', element: <UsersPage /> },
      { path: '/roles', element: <PlaceholderPage titleKey="nav.roles" /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
