import { Link } from 'react-router-dom'
import { DueLabel, formatDate } from '@/features/assignments'
import { CheckIcon } from '@/shared/components/icons'
import { Panel } from '@/features/dashboard/components/DashboardPanels'
import type { UpcomingItem } from '@/features/dashboard/types'
import { useI18n } from '@/shared/i18n'
import { paths } from '@/shared/config/paths'

const MAX_ROWS = 5

/** Unfinished assignments by deadline, so what is overdue or due soon is at the top. */
export function UpcomingDeadlines({ items }: { items: UpcomingItem[] }) {
  const { t, locale } = useI18n()

  return (
    <Panel title={t('tdash.upcoming')} to={paths.assign}>
      {items.length === 0 ? (
        <p className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 [&>svg]:h-4 [&>svg]:w-4">
            <CheckIcon />
          </span>
          {t('tdash.upcomingEmpty')}
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {items.slice(0, MAX_ROWS).map((item) => (
            <li key={item.id}>
              <Link
                to={paths.assignDetail(item.id)}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {item.className} · {t('cdet.assignedTo', { count: String(item.assignees) })}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs">
                  <DueLabel deadline={item.deadline} className="block font-medium" />
                  <span className="block text-muted">{formatDate(item.deadline, locale)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
