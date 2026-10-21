import { NotificationIcon } from '@/shared/components/NotificationIcon'
import { useNotifications } from '@/shared/components/Toast'
import { Panel } from '@/features/dashboard/components/DashboardPanels'
import { useI18n } from '@/shared/i18n'
import { formatTimeAgo } from '@/shared/lib/timeAgo'
import { paths } from '@/shared/config/paths'

const MAX_ROWS = 4

/** The latest notifications, newest first. */
export function RecentActivity() {
  const { t, locale } = useI18n()
  const { notifications } = useNotifications()

  return (
    <Panel title={t('tdash.recentActivity')} to={paths.notifications}>
      {notifications.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted">{t('notif.emptyTitle')}</p>
      ) : (
        <ul className="divide-y divide-line">
          {notifications.slice(0, MAX_ROWS).map((n) => (
            <li key={n.id} className="flex items-center gap-3 px-4 py-2.5">
              <NotificationIcon variant={n.variant} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{n.title}</span>
                <span className="block truncate text-xs text-muted">{n.subtitle}</span>
              </span>
              <span className="shrink-0 text-xs text-muted">{formatTimeAgo(n.createdAt, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
