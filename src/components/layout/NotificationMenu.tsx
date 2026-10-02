import { useCallback, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BellIcon, CheckIcon } from '@/components/ui/icons'
import { NotificationEmpty, NotificationGroup, NotificationItem } from '@/components/ui/NotificationParts'
import { useNotifications } from '@/components/ui/Toast'
import { useDismissable } from '@/hooks/useDismissable'
import { useI18n } from '@/lib/i18n'

// Up to this many notifications show without scrolling; more get a scrollable list.
const MAX_VISIBLE = 4

export default function NotificationMenu() {
  const { t } = useI18n()
  const { notifications, markAllRead } = useNotifications()
  const reduceMotion = useReducedMotion()
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useDismissable(open, close, rootRef, buttonRef)

  const unread = notifications.filter((n) => !n.read).length
  const fresh = notifications.filter((n) => !n.read)
  const earlier = notifications.filter((n) => n.read)
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `${t('header.notifications')} (${unread})` : t('header.notifications')}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
      >
        <BellIcon />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={hidden}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={hidden}
            transition={{ duration: 0.15 }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-full z-40 mt-2 w-96 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <p className="text-sm font-semibold">
                {t('header.notifications')}
                {unread > 0 && <span className="ml-1.5 text-accent-fg">({unread})</span>}
              </p>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unread === 0}
                aria-label={t('notif.markAllRead')}
                title={t('notif.markAllRead')}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40 [&>svg]:h-4 [&>svg]:w-4"
              >
                <CheckIcon />
              </button>
            </div>

            {notifications.length === 0 ? (
              <NotificationEmpty />
            ) : (
              <div className={notifications.length > MAX_VISIBLE ? 'h-80 overflow-y-auto overscroll-contain' : ''}>
                {fresh.length > 0 && (
                  <NotificationGroup label={t('notif.groupNew')}>
                    {fresh.map((n) => (
                      <NotificationItem key={n.id} notification={n} onOpen={close} />
                    ))}
                  </NotificationGroup>
                )}
                {earlier.length > 0 && (
                  <NotificationGroup label={t('notif.groupEarlier')}>
                    {earlier.map((n) => (
                      <NotificationItem key={n.id} notification={n} />
                    ))}
                  </NotificationGroup>
                )}
              </div>
            )}

            <Link
              to="/notifications"
              onClick={close}
              className="block border-t border-line px-4 py-2.5 text-center text-xs font-medium text-accent-fg transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            >
              {t('notif.viewAll')}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
