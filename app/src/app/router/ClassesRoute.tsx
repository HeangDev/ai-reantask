import { Suspense, lazy } from 'react'
import { PageSkeleton } from '@/shared/components/PageSkeleton'
import { useSession } from '@/shared/store/authStore'

const AllClassesPage = lazy(() => import('@/features/classes/pages/ClassesPage').then((m) => ({ default: m.ClassesPage })))
const TeacherClassesPage = lazy(() =>
  import('@/features/classes/pages/TeacherClassesPage').then((m) => ({ default: m.TeacherClassesPage })),
)
const StudentClassesPage = lazy(() =>
  import('@/features/classes/pages/StudentClassesPage').then((m) => ({ default: m.StudentClassesPage })),
)

/** Admins manage every class, a teacher sees their own, and a student sees the classes they joined. */
export function ClassesRoute() {
  const role = useSession()?.role
  const Page = role === 'teacher' ? TeacherClassesPage : role === 'student' ? StudentClassesPage : AllClassesPage
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Page />
    </Suspense>
  )
}
