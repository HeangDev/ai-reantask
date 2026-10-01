import { useI18n } from '@/lib/i18n'
import { daysUntil } from '@/features/assignments/lib/dates'

/** Relative deadline, e.g. "Due in 4 days". Colour hints urgency; the text carries the meaning. */
export default function DueLabel({ deadline, className = '' }: { deadline: string; className?: string }) {
  const { t } = useI18n()
  const days = daysUntil(deadline)

  const text =
    days < 0 ? t('due.overdue', { days: String(-days) })
    : days === 0 ? t('due.today')
    : days === 1 ? t('due.tomorrow')
    : t('due.inDays', { days: String(days) })

  const tone =
    days < 0 ? 'text-red-600 dark:text-red-400'
    : days <= 2 ? 'text-amber-600 dark:text-amber-400'
    : 'text-muted'

  return <span className={`${tone} ${className}`}>{text}</span>
}
