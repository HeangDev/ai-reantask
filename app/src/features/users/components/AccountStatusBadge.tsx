import type { AccountStatus } from '@/features/users/types'
import { useI18n } from '@/lib/i18n'

const styles: Record<AccountStatus, { badge: string; dot: string }> = {
  active: { badge: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  inactive: { badge: 'text-muted', dot: 'bg-slate-400' },
}

/** Dot plus label, so the state never relies on colour alone. */
export default function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const { t } = useI18n()
  return (
    <span className={`inline-flex items-center gap-1.5 ${styles[status].badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles[status].dot}`} aria-hidden="true" />
      {t(status === 'active' ? 'usr.active' : 'usr.inactive')}
    </span>
  )
}
