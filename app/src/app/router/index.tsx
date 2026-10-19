import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { MainLayout } from '@/app/layouts/MainLayout'
import { ClassesRoute } from '@/app/router/ClassesRoute'
import { RequireAuth, RequireRole } from '@/app/router/guards'
import { RouteError } from '@/app/router/RouteError'
import { ForbiddenPage, NotFoundPage, Splash } from '@/app/router/StatusPages'
import { roleHome } from '@/features/auth'
import type { TranslationKey } from '@/shared/i18n'
import { paths } from '@/shared/config/paths'
import { useSession } from '@/shared/store/authStore'

// Every page is a separate chunk (routing.md §3); `lazy` loads it when the route is first visited.
const page =
  <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  async () => ({ Component: (await load())[name] })

const titled = (titleKey: TranslationKey) => ({ handle: { titleKey } })

function HomeRedirect() {
  const session = useSession()
  return <Navigate to={session ? roleHome[session.role] : paths.login} replace />
}

/** The route table; tests mount it in a memory router. */
export const routes: RouteObject[] = [
  {
    path: paths.login,
    lazy: page(() => import('@/features/auth/pages/LoginPage'), 'LoginPage'),
    errorElement: <RouteError />,
    ...titled('nav.login'),
  },
  {
    path: paths.register,
    lazy: page(() => import('@/features/auth/pages/RegisterPage'), 'RegisterPage'),
    errorElement: <RouteError />,
    ...titled('register.pageTitle'),
  },
  {
    path: paths.forgotPassword,
    lazy: page(() => import('@/features/auth/pages/ForgotPasswordPage'), 'ForgotPasswordPage'),
    errorElement: <RouteError />,
    ...titled('forgot.pageTitle'),
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <Splash />,
    children: [
      {
        element: <MainLayout />,
        errorElement: <RouteError />,
        children: [
          { path: paths.home, element: <HomeRedirect /> },
          { path: paths.forbidden, element: <ForbiddenPage /> },
          {
            path: paths.dashboard,
            lazy: page(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage'),
            ...titled('nav.dashboard'),
          },
          {
            path: paths.account,
            lazy: page(() => import('@/features/account/pages/AccountPage'), 'AccountPage'),
            ...titled('header.accountSettings'),
          },
          { path: paths.classes, element: <ClassesRoute />, ...titled('nav.classes') },
          {
            element: <RequireRole roles={['student']} />,
            children: [
              {
                path: paths.classAssignments,
                lazy: page(() => import('@/features/assignments/pages/AssignmentsPage'), 'AssignmentsPage'),
                ...titled('nav.assignments'),
              },
            ],
          },
          {
            element: <RequireRole roles={['teacher', 'admin']} />,
            children: [
              {
                path: paths.tasks,
                lazy: page(() => import('@/features/tasks/pages/TasksPage'), 'TasksPage'),
                ...titled('nav.tasks'),
              },
              {
                path: paths.notifications,
                lazy: page(() => import('@/features/notifications/pages/NotificationsPage'), 'NotificationsPage'),
                ...titled('header.notifications'),
              },
              {
                path: paths.settings,
                lazy: page(() => import('@/features/settings/pages/SettingsPage'), 'SettingsPage'),
                ...titled('nav.settings'),
              },
            ],
          },
          {
            element: <RequireRole roles={['teacher']} />,
            children: [
              {
                path: paths.assign,
                lazy: page(() => import('@/features/assignments/pages/AssignPage'), 'AssignPage'),
                ...titled('nav.assign'),
              },
              {
                path: `${paths.assign}/:id`,
                lazy: page(() => import('@/features/assignments/pages/AssignDetailPage'), 'AssignDetailPage'),
                ...titled('nav.assign'),
              },
              {
                path: `${paths.assign}/:id/code`,
                lazy: page(() => import('@/features/assignments/pages/CodeEditorPage'), 'CodeEditorPage'),
                ...titled('nav.assign'),
              },
              {
                path: paths.scoreReport,
                lazy: page(() => import('@/features/reports/pages/ScoreReportPage'), 'ScoreReportPage'),
                ...titled('nav.scoreReport'),
              },
              {
                path: paths.integration,
                lazy: page(() => import('@/features/integrations/pages/IntegrationsPage'), 'IntegrationsPage'),
                ...titled('nav.integration'),
              },
            ],
          },
          {
            element: <RequireRole roles={['admin']} />,
            children: [
              {
                path: paths.students,
                lazy: page(() => import('@/features/students/pages/StudentsPage'), 'StudentsPage'),
                ...titled('nav.students'),
              },
              {
                path: paths.teachers,
                lazy: page(() => import('@/features/teachers/pages/TeachersPage'), 'TeachersPage'),
                ...titled('nav.teachers'),
              },
              {
                path: paths.subjects,
                lazy: page(() => import('@/features/subjects/pages/SubjectsPage'), 'SubjectsPage'),
                ...titled('nav.subjects'),
              },
              {
                path: paths.users,
                lazy: page(() => import('@/features/users/pages/UsersPage'), 'UsersPage'),
                ...titled('nav.users'),
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
