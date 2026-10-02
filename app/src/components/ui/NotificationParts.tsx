import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellIcon, CloseIcon } from '@/components/ui/icons'
import NotificationIcon from '@/components/ui/NotificationIcon'
import { useNotifications } from '@/components/ui/Toast'
import type { AppNotification } from '@/components/ui/Toast'
import { useI18n } from '@/lib/i18n'
import { formatTimeAgo } from '@/lib/timeAgo'

/** One compact row. Selecting it marks it as read and opens its page, if it has one; the X removes it. */
export function NotificationItem({ notification: n, onOpen }: { notification: AppNotification; onOpen?: () => void }) {
  const { t, locale } = useI18n()
  const { markRead, remove } = useNotifications()
  const navigate = useNavigate()
  const timeAgo = formatTimeAgo(n.createdAt, locale)

  return (
    <li
      className={`group relative border-b border-line transition-colors hover:bg-hover ${
        n.read ? '' : 'bg-accent-soft/40'
      }`}
    >
      <button
        type="button"
        onClick={() => {
          markRead(n.id)
          if (n.to) {
            navigate(n.to)
            onOpen?.()
          }
        }}
        className="flex w-full items-start gap-3 px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <NotificationIcon variant={n.variant} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={`truncate text-sm ${n.read ? 'font-medium text-muted' : 'font-semibold'}`}>{n.title}</span>
            <span className="shrink-0 text-[11px] text-muted">{timeAgo}</span>
          </span>
          <span className="mt-0.5 block text-xs text-muted">{n.subtitle}</span>
        </span>
        {!n.read && <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
      </button>
      <button
        type="button"
        onClick={() => remove(n.id)}
        aria-label={t('notif.remove')}
        className="absolute bottom-1.5 right-2 rounded p-1 text-muted opacity-0 transition-opacity hover:bg-line hover:text-fg focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent group-hover:opacity-100 [&>svg]:h-3 [&>svg]:w-3"
      >
        <CloseIcon />
      </button>
    </li>
  )
}

/** Small section label, such as "New" or "Earlier". */
export function NotificationGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</h3>
      <ul>{children}</ul>
    </section>
  )
}

export function NotificationEmpty() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-fg ring-8 ring-accent-soft/40 [&>svg]:h-6 [&>svg]:w-6"
      >
        <BellIcon />
      </span>
      <p className="mt-4 text-sm font-semibold">{t('notif.emptyTitle')}</p>
      <p className="mt-1 text-xs text-muted">{t('notif.emptyDesc')}</p>
    </div>
  )
}
