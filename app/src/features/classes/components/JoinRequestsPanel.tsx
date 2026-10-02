import Avatar from '@/components/ui/Avatar'
import { CheckIcon, CloseIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import { useSession } from '@/features/auth/store/authStore'
import { useTeacherClassScope } from '@/features/teachers/hooks/useCurrentTeacher'
import { useClasses } from '@/features/classes/store/classesStore'
import { joinRequestsActions, useJoinRequests } from '@/features/classes/store/joinRequestsStore'
import type { JoinRequest } from '@/features/classes/store/joinRequestsStore'
import { useI18n } from '@/lib/i18n'
import { formatTimeAgo } from '@/lib/timeAgo'

/** Students waiting to join a class. The teacher approves or declines, and the student is told either way. */
export default function JoinRequestsPanel() {
  const { t, locale } = useI18n()
  const { notify, notifyRole } = useToast()
  const role = useSession()?.role
  const classes = useClasses()
  const requests = useJoinRequests()
  const scope = useTeacherClassScope()
  // A teacher only answers requests to join the classes they teach.
  const pending = requests.filter((r) => r.status === 'pending' && (!scope || scope.has(r.classId)))

  // Only a teacher approves who joins a class.
  if (role !== 'teacher' || pending.length === 0) return null

  const className = (r: JoinRequest) => classes.find((c) => c.id === r.classId)?.name ?? ''

  const approve = (r: JoinRequest) => {
    const name = className(r)
    joinRequestsActions.resolve(r.id, 'approved')
    notify({ title: t('joinreq.approvedToast'), subtitle: t('joinreq.approvedToastDesc', { student: r.student, name }) })
    notifyRole('student', {
      title: t('join.approvedTitle'),
      subtitle: t('join.approvedDesc', { name }),
      to: '/my-classes',
    })
  }

  const decline = (r: JoinRequest) => {
    const name = className(r)
    joinRequestsActions.resolve(r.id, 'declined')
    notify({ variant: 'danger', title: t('joinreq.declinedToast'), subtitle: t('joinreq.declinedToastDesc', { student: r.student, name }) })
    notifyRole('student', { variant: 'danger', title: t('join.declinedTitle'), subtitle: t('join.declinedDesc', { name }) })
  }

  return (
    <section aria-labelledby="join-requests" className="mt-5 overflow-hidden rounded-xl border border-amber-300 bg-surface dark:border-amber-500/40">
      <h2
        id="join-requests"
        className="flex items-center gap-2 border-b border-line bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
      >
        {t('joinreq.title')}
        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs dark:bg-amber-500/30">{pending.length}</span>
      </h2>
      <ul className="divide-y divide-line">
        {pending.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Avatar name={r.student} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t('joinreq.wants', { student: r.student, name: className(r) })}</p>
              <p className="text-xs text-muted">{formatTimeAgo(r.createdAt, locale)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => decline(r)}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-3.5 [&>svg]:w-3.5"
              >
                <CloseIcon />
                {t('joinreq.decline')}
              </button>
              <button
                type="button"
                onClick={() => approve(r)}
                className="flex items-center gap-1.5 rounded-lg bg-accent-strong px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-3.5 [&>svg]:w-3.5"
              >
                <CheckIcon />
                {t('joinreq.approve')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
