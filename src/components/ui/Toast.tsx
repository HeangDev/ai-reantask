import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CloseIcon } from '@/components/ui/icons'
import NotificationIcon from '@/components/ui/NotificationIcon'
import type { NotificationVariant } from '@/components/ui/NotificationIcon'
import { getSession, useSession } from '@/features/auth/store/authStore'
import type { Role } from '@/features/auth/types'
import { useI18n } from '@/lib/i18n'
import { createSampleNotifications } from '@/lib/sampleNotifications'

const DURATION_MS = 4000

export interface ToastContent {
  title: string
  subtitle: string
  /** Picks the icon and colour; defaults to 'success'. */
  variant?: NotificationVariant
  /** Page the notification opens when it is selected. */
  to?: string
}

interface ToastMessage extends ToastContent {
  id: string
  variant: NotificationVariant
}

export interface AppNotification extends ToastContent {
  id: string
  variant: NotificationVariant
  /** Who the notification is for. A student never sees a teacher's, and the other way round. */
  audience: Role
  createdAt: number
  read: boolean
}

interface ToastValue {
  /** Shows a success toast that dismisses itself and records it in the notification list. */
  notify: (content: ToastContent) => void
  /** Leaves a notification for another role without popping a toast up on this screen. */
  notifyRole: (audience: Role, content: ToastContent) => void
  /** Every role's notifications; read them through useNotifications, which keeps only the current role's. */
  notifications: AppNotification[]
  markRead: (id: string) => void
  markAllRead: (audience: Role) => void
  remove: (id: string) => void
  clearAll: (audience: Role) => void
}

const MAX_NOTIFICATIONS = 50

const ToastContext = createContext<ToastValue | null>(null)

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const offscreen = reduceMotion ? { opacity: 0 } : { opacity: 0, x: 48, scale: 0.95 }

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <motion.li
      layout={!reduceMotion}
      initial={offscreen}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={offscreen}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3 pr-2 shadow-lg">
      <NotificationIcon variant={toast.variant} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        <p className="mt-0.5 text-sm text-muted">{toast.subtitle}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={t('dialog.close')}
        className="rounded p-0.5 text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
      >
        <CloseIcon />
      </button>
    </motion.li>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>(createSampleNotifications)

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((x) => x.id !== id))
  }, [])

  const record = useCallback((content: ToastContent, audience: Role) => {
    const item = { id: crypto.randomUUID(), ...content, variant: content.variant ?? 'success' }
    setNotifications((list) => [{ ...item, audience, createdAt: Date.now(), read: false }, ...list].slice(0, MAX_NOTIFICATIONS))
    return item
  }, [])

  // The notification belongs to whoever is signed in when the action happens.
  const notify = useCallback(
    (content: ToastContent) => {
      const item = record(content, getSession()?.role ?? 'teacher')
      setToasts((list) => [...list, item])
    },
    [record],
  )

  const notifyRole = useCallback((audience: Role, content: ToastContent) => void record(content, audience), [record])

  const markRead = useCallback(
    (id: string) => setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [],
  )
  const remove = useCallback((id: string) => setNotifications((list) => list.filter((n) => n.id !== id)), [])
  const markAllRead = useCallback(
    (audience: Role) => setNotifications((list) => list.map((n) => (n.audience === audience ? { ...n, read: true } : n))),
    [],
  )
  const clearAll = useCallback(
    (audience: Role) => setNotifications((list) => list.filter((n) => n.audience !== audience)),
    [],
  )

  const value = useMemo<ToastValue>(
    () => ({ notify, notifyRole, notifications, markRead, markAllRead, remove, clearAll }),
    [notify, notifyRole, notifications, markRead, markAllRead, remove, clearAll],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ul
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </ul>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used within ToastProvider')
  return value
}

/** The signed-in role's notifications only, with actions that touch only those. */
export function useNotifications() {
  const { notifications, markRead, markAllRead, remove, clearAll } = useToast()
  const role = useSession()?.role

  return useMemo(
    () => ({
      notifications: role ? notifications.filter((n) => n.audience === role) : [],
      markRead,
      markAllRead: () => role && markAllRead(role),
      remove,
      clearAll: () => role && clearAll(role),
    }),
    [notifications, role, markRead, markAllRead, remove, clearAll],
  )
}
