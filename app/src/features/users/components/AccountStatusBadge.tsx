import type { AccountStatus } from '@/features/users/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const styles: Record<AccountStatus, { badge: string; dot: string; label: TranslationKey }> = {
  PENDING: { badge: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', label: 'usr.pending' },
  ACTIVE: { badge: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'usr.active' },
  INACTIVE: { badge: 'text-muted', dot: 'bg-slate-400', label: 'usr.inactive' },
  SUSPENDED: { badge: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', label: 'usr.suspended' },
}

/** Dot plus label, so the state never relies on colour alone. */
export default function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const { t } = useI18n()
  return (
    <span className={`inline-flex items-center gap-1.5 ${styles[status].badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles[status].dot}`} aria-hidden="true" />
      {t(styles[status].label)}
    </span>
  )
}
