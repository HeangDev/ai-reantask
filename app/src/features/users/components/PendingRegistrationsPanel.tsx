import { useToast } from '@/components/ui/Toast'
import { useSession } from '@/features/auth/store/authStore'
import { registrationsActions, useRegistrations } from '@/features/auth/store/registrationsStore'
import type { Registration } from '@/features/auth/store/registrationsStore'
import PendingRegistrationsTable from '@/features/users/components/PendingRegistrationsTable'
import { usersActions } from '@/features/users/store/usersStore'
import { useI18n } from '@/lib/i18n'

/**
 * Students who registered and are waiting for approval. An admin or a teacher can answer, so a busy admin does
 * not hold anyone up. Approving adds them as users and lets them sign in.
 */
export default function PendingRegistrationsPanel() {
  const { t } = useI18n()
  const { notify } = useToast()
  const role = useSession()?.role
  const pending = useRegistrations().filter((r) => r.status === 'pending')

  if ((role !== 'admin' && role !== 'teacher') || pending.length === 0) return null

  const approve = (r: Registration) => {
    registrationsActions.resolve(r.id, 'approved')
    // The registration asked for no phone number, so it starts empty and can be filled in when editing.
    usersActions.add({ fullName: r.fullName, email: r.email, phone: '', role: r.role, status: 'active' })
    notify({ title: t('reg.approvedToast'), subtitle: t('reg.approvedToastDesc', { name: r.fullName }) })
  }

  const decline = (r: Registration) => {
    registrationsActions.resolve(r.id, 'declined')
    notify({ variant: 'danger', title: t('reg.declinedToast'), subtitle: t('reg.declinedToastDesc', { name: r.fullName }) })
  }

  return (
    <section aria-labelledby="pending-registrations" className="mt-4 overflow-hidden rounded-xl border border-amber-300 bg-surface dark:border-amber-500/40">
      <h2
        id="pending-registrations"
        className="flex items-center gap-2 border-b border-line bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
      >
        {t('reg.title')}
        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs dark:bg-amber-500/30">{pending.length}</span>
      </h2>
      <PendingRegistrationsTable registrations={pending} onApprove={approve} onDecline={decline} />
    </section>
  )
}
