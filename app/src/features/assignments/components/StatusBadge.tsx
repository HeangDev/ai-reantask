import { useI18n } from '@/lib/i18n'
import type { AssignmentStatus } from '@/features/assignments/types'

export const statusStyles: Record<AssignmentStatus, { badge: string; dot: string }> = {
  pending: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300', dot: 'bg-amber-500' },
  submitted: { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300', dot: 'bg-blue-500' },
  graded: { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300', dot: 'bg-emerald-500' },
  late: { badge: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300', dot: 'bg-red-500' },
  resubmit: { badge: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300', dot: 'bg-purple-500' },
}

export default function StatusBadge({ status }: { status: AssignmentStatus }) {
  const { t } = useI18n()
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusStyles[status].badge}`}>
      {t(`status.${status}` as const)}
    </span>
  )
}
