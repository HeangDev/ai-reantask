# Routing (react-router)

Use the **data router** API: `createBrowserRouter` + `RouterProvider`.

## 1. Route map

| Path                                                                        | Role    | Page                         |
|-----------------------------------------------------------------------------|---------|------------------------------|
| `/login`                                                                    | public  | Login                        |
| `/`                                                                         | any     | Redirect by role             |
| `/student`                                                                  | student | Dashboard                    |
| `/student/courses/:courseId`                                                | student | Course assignments           |
| `/student/assignments/:assignmentId`                                        | student | Assignment detail + submit   |
| `/student/submissions/:submissionId`                                        | student | Submission status + feedback |
| `/teacher`                                                                  | teacher | Dashboard                    |
| `/teacher/assignments`                                                      | teacher | List                         |
| `/teacher/assignments/new` · `/:id/edit`                                    | teacher | Assignment form              |
| `/teacher/assignments/:id/submissions`                                      | teacher | Submissions table            |
| `/teacher/submissions/:submissionId/review`                                 | teacher | Review screen                |
| `/teacher/rubrics`                                                          | teacher | Rubrics                      |
| `/admin/users` · `/admin/courses` · `/admin/rubrics` · `/admin/ai-settings` | admin   | Management                   |
| `/notifications`                                                            | any     | Notification list            |
| `/403` · `*`                                                                | any     | Forbidden / Not found        |

## 2. Structure

```tsx
const router = createBrowserRouter([
  { path: '/login', element: <AuthLayout />, children: [{ index: true, lazy: () => import('...Login') }] },
  { element: <RequireAuth />, errorElement: <RouteError />, children: [
    { path: 'student', element: <RequireRole role="student"><StudentLayout/></RequireRole>, children: [...] },
    { path: 'teacher', element: <RequireRole role="teacher"><TeacherLayout/></RequireRole>, children: [...] },
    { path: 'admin',   element: <RequireRole role="admin"><AdminLayout/></RequireRole>, children: [...] },
  ]},
  { path: '*', element: <NotFound /> },
]);
```

## 3. Rules

- Routes defined centrally in `app/router/`; paths come from a typed `paths.ts` helper (`paths.teacher.review(id)`) — no string literals in components.
- Every page is **lazy** (`lazy:` or `React.lazy`) wrapped with `Suspense` + skeleton fallback.
- `RequireAuth`: if no session → `/login?returnTo=<encoded path>`; session bootstrap shows full-screen splash until resolved (avoid login flash).
- `RequireRole`: wrong role → `/403`. (UX only; backend enforces.)
- Each route tree has an `errorElement` (React Router error boundary).
- Validate route params with Zod (`useParams` → `idSchema.safeParse`); invalid → NotFound.
- Preload on intent: `<Link onMouseEnter>` can call `queryClient.prefetchQuery` for detail pages.
- Use `<Link>`/`<NavLink>`; never `<a href>` for internal navigation.
- Page title: set via `useDocumentTitle(t('...'))`; move focus to `<h1>` or main on route change (a11y).
- Unsaved changes: `useBlocker`.
- Scroll restoration: `<ScrollRestoration />`.