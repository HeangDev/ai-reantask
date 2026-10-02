import { useI18n } from '@/lib/i18n'

export type ActiveStatus = 'active' | 'inactive'

const styles: Record<ActiveStatus, { badge: string; dot: string }> = {
  active: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  inactive: { badge: 'bg-sunken text-muted', dot: 'bg-muted' },
}

/** Green "Active" or grey "Inactive" pill. */
export default function StatusBadge({ status }: { status: ActiveStatus }) {
  const { t } = useI18n()
  const { badge, dot } = styles[status]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {t(status === 'active' ? 'usr.active' : 'usr.inactive')}
    </span>
  )
}
