import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { CheckIcon, CloseIcon } from '@/components/ui/icons'
import NotificationIcon from '@/components/ui/NotificationIcon'
import type { NotificationVariant } from '@/components/ui/NotificationIcon'
import { useNotifications } from '@/components/ui/Toast'
import type { AppNotification } from '@/components/ui/Toast'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import { formatTimeAgo } from '@/lib/timeAgo'

export const kindLabelKeys: Record<NotificationVariant, TranslationKey> = {
  success: 'notif.kindSuccess',
  info: 'notif.kindInfo',
  danger: 'notif.kindDanger',
}

const kindBadge: Record<NotificationVariant, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

const iconButton =
  'rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4'

/** Full-size notification row for the Notifications page. */
export default function NotificationCard({ notification: n }: { notification: AppNotification }) {
  const { t, locale } = useI18n()
  const { markRead, remove } = useNotifications()
  const reduceMotion = useReducedMotion()
  const time = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(n.createdAt)

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-start gap-4 overflow-hidden rounded-xl border p-4 transition-colors ${
        n.read ? 'border-line bg-surface' : 'border-accent/30 bg-accent-soft/40'
      }`}
    >
      {!n.read && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent" />}
      <NotificationIcon variant={n.variant} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm ${n.read ? 'font-medium' : 'font-semibold'}`}>{n.title}</p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${kindBadge[n.variant]}`}>
            {t(kindLabelKeys[n.variant])}
          </span>
          {!n.read && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />}
        </div>
        <p className="mt-1 text-sm text-muted">{n.subtitle}</p>
        <p className="mt-2 text-xs text-muted">
          {formatTimeAgo(n.createdAt, locale)} · {time}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {n.to && (
          <Link
            to={n.to}
            onClick={() => markRead(n.id)}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-accent-fg transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent"
          >
            {t('notif.open')}
          </Link>
        )}
        {!n.read && (
          <button
            type="button"
            onClick={() => markRead(n.id)}
            aria-label={t('notif.markRead')}
            title={t('notif.markRead')}
            className={iconButton}
          >
            <CheckIcon />
          </button>
        )}
        <button
          type="button"
          onClick={() => remove(n.id)}
          aria-label={t('notif.remove')}
          title={t('notif.remove')}
          className={iconButton}
        >
          <CloseIcon />
        </button>
      </div>
    </motion.li>
  )
}
