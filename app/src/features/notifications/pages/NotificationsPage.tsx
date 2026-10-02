import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import { BellIcon, CheckIcon, SearchIcon } from '@/components/ui/icons'
import type { NotificationVariant } from '@/components/ui/NotificationIcon'
import { NotificationEmpty } from '@/components/ui/NotificationParts'
import { useNotifications } from '@/components/ui/Toast'
import NotificationCard, { kindLabelKeys } from '@/features/notifications/components/NotificationCard'
import { groupByDay } from '@/features/notifications/lib/groupByDay'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

type Filter = 'all' | 'unread' | NotificationVariant

// How many notifications show at first, and how many more each "Show more" adds.
const PAGE_SIZE = 5

const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

function StatCard({ label, value, tone, icon }: { label: string; value: number; tone: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${tone}`}
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted">{label}</p>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { t } = useI18n()
  const { notifications, markAllRead, clearAll } = useNotifications()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const unread = notifications.filter((n) => !n.read).length
  const count = (variant: NotificationVariant) => notifications.filter((n) => n.variant === variant).length

  const filters: { value: Filter; labelKey: TranslationKey; count: number }[] = [
    { value: 'all', labelKey: 'notif.filterAll', count: notifications.length },
    { value: 'unread', labelKey: 'notif.statUnread', count: unread },
    { value: 'success', labelKey: kindLabelKeys.success, count: count('success') },
    { value: 'info', labelKey: kindLabelKeys.info, count: count('info') },
    { value: 'danger', labelKey: kindLabelKeys.danger, count: count('danger') },
  ]

  const { groups, shown, total } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = notifications.filter(
      (n) =>
        (filter === 'all' || (filter === 'unread' ? !n.read : n.variant === filter)) &&
        `${n.title} ${n.subtitle}`.toLowerCase().includes(q),
    )
    return { groups: groupByDay(matches.slice(0, limit)), shown: Math.min(limit, matches.length), total: matches.length }
  }, [notifications, filter, query, limit])

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('header.notifications')}</h1>
          <p className="mt-1 text-sm text-muted">{t('notif.pageDesc')}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0}
            className={`flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover disabled:pointer-events-none disabled:opacity-40 [&>svg]:h-4 [&>svg]:w-4 ${focusRing}`}
          >
            <CheckIcon />
            {t('notif.markAllRead')}
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={notifications.length === 0}
            className={`rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-hover disabled:pointer-events-none disabled:opacity-40 dark:text-red-400 ${focusRing}`}
          >
            {t('notif.clear')}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t('notif.statTotal')}
          value={notifications.length}
          tone="bg-accent-soft text-accent-fg"
          icon={<BellIcon />}
        />
        <StatCard
          label={t('notif.statUnread')}
          value={unread}
          tone="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
          icon={<BellIcon />}
        />
        <StatCard
          label={t('notif.statRead')}
          value={notifications.length - unread}
          tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          icon={<CheckIcon />}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label={t('header.notifications')} className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => {
                setFilter(item.value)
                setLimit(PAGE_SIZE)
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${focusRing} ${
                filter === item.value
                  ? 'border-accent bg-accent-soft text-accent-fg'
                  : 'border-line text-muted hover:bg-hover hover:text-fg'
              }`}
            >
              {t(item.labelKey)}
              <span className="rounded-full bg-sunken px-1.5 text-[11px] text-fg">{item.count}</span>
            </button>
          ))}
        </div>

        <label className="relative lg:w-64">
          <span className="sr-only">{t('notif.search')}</span>
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE_SIZE)
            }}
            placeholder={t('notif.searchPh')}
            className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
          />
        </label>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-5 rounded-xl border border-line bg-surface">
          <NotificationEmpty />
        </div>
      ) : groups.length === 0 ? (
        <p className="mt-5 rounded-xl border border-line p-10 text-center text-sm text-muted">{t('notif.noMatch')}</p>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t(group.labelKey)}</h2>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {group.items.map((n) => (
                    <NotificationCard key={n.id} notification={n} />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}

          <div className="flex flex-col items-center gap-2 pt-1">
            <p className="text-xs text-muted">{t('notif.showing', { shown: String(shown), total: String(total) })}</p>
            {shown < total && (
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE_SIZE)}
                className={`rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-hover ${focusRing}`}
              >
                {t('notif.showMore', { count: String(total - shown) })}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
