import { Link } from 'react-router-dom'
import { formatDate } from '@/features/assignments'
import { Avatar } from '@/shared/components/Avatar'
import { CheckIcon } from '@/shared/components/icons'
import { Panel } from '@/features/dashboard/components/DashboardPanels'
import type { PendingReview } from '@/features/dashboard/types'
import { useI18n } from '@/shared/i18n'
import { paths } from '@/shared/config/paths'

const MAX_ROWS = 5

/** Handed-in work the teacher has not verified yet, the one waiting longest first. */
export function ReviewQueue({ reviews }: { reviews: PendingReview[] }) {
  const { t, locale } = useI18n()

  return (
    <Panel title={t('tdash.needsReview')} to={paths.assign}>
      {reviews.length === 0 ? (
        <p className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 [&>svg]:h-4 [&>svg]:w-4">
            <CheckIcon />
          </span>
          {t('tdash.allReviewed')}
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {reviews.slice(0, MAX_ROWS).map((r) => (
            <li key={`${r.assignmentId}-${r.student}`}>
              <Link
                to={paths.assignDetail(r.assignmentId)}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <Avatar name={r.student} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.student}</span>
                  <span className="block truncate text-xs text-muted">
                    {r.assignmentTitle} · {r.className}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">{formatDate(r.submittedAt, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
