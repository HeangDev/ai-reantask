import Button from '@/components/ui/Button'
import { useProfile } from '@/features/account/store/accountStore'
import { useSession } from '@/features/auth/store/authStore'
import AdminDashboard from '@/features/dashboard/components/AdminDashboard'
import StudentDashboard from '@/features/dashboard/components/StudentDashboard'
import TeacherDashboard from '@/features/dashboard/components/TeacherDashboard'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import { useI18n } from '@/lib/i18n'

/** Each role gets its own dashboard; both bring their own greeting heading. */
export default function DashboardPage() {
  const { t } = useI18n()
  const { state, retry } = useDashboard()
  const role = useSession()?.role
  const profile = useProfile()

  if (role === 'admin') {
    return (
      <section className="p-4 sm:p-6">
        <AdminDashboard />
      </section>
    )
  }

  if (role === 'teacher') {
    return (
      <section className="p-4 sm:p-6">
        <TeacherDashboard />
      </section>
    )
  }

  return (
    <section className="p-4 sm:p-6">
      {state.status === 'loading' && (
        <p role="status" className="p-10 text-center text-sm text-muted">
          {t('dash.loading')}
        </p>
      )}

      {state.status === 'error' && (
        <div role="alert" className="rounded-xl border border-line bg-surface p-10 text-center">
          <p className="font-semibold">{t('dash.errorTitle')}</p>
          <p className="mb-4 mt-1 text-sm text-muted">{t('dash.errorDesc')}</p>
          <Button type="button" onClick={retry}>
            {t('dash.retry')}
          </Button>
        </div>
      )}

      {state.status === 'empty' && (
        <div className="rounded-xl border border-line bg-surface p-10 text-center">
          <p className="font-semibold">{t('dash.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('dash.emptyDesc')}</p>
        </div>
      )}

      {state.status === 'success' && (
        <StudentDashboard data={state.data} name={profile.fullName} attention={state.data.stats.todo} />
      )}
    </section>
  )
}
