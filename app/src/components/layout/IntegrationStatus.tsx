import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { IntegrationIcon } from '@/components/ui/icons'
import IntegrationLogo from '@/features/integrations/components/IntegrationLogo'
import { integrations } from '@/features/integrations/data/integrations'
import { useConnectedIntegrations } from '@/features/integrations/store/integrationsStore'
import { useI18n } from '@/lib/i18n'

const MAX_NAMES = 2
const chip =
  'flex h-8 shrink-0 items-center gap-2 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const spring = { type: 'spring', stiffness: 400, damping: 28 } as const

/** Header badge: whether the user has linked any integration, and which ones. */
export default function IntegrationStatus() {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const connectedIds = useConnectedIntegrations()
  const apps = integrations.filter((item) => connectedIds.has(item.id))
  const names = apps.map((a) => a.name)
  const label = names.slice(0, MAX_NAMES).join(', ') + (names.length > MAX_NAMES ? ` +${names.length - MAX_NAMES}` : '')
  const connected = apps.length > 0

  // Bumps each time another app gets connected, to replay the celebration (ripple + shine).
  const [celebration, setCelebration] = useState(0)
  const previousCount = useRef(apps.length)
  useEffect(() => {
    if (apps.length > previousCount.current) setCelebration((n) => n + 1)
    previousCount.current = apps.length
  }, [apps.length])

  const swap = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: -4 }
  const pop = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0 }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={connected ? 'connected' : 'none'}
        initial={swap}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={swap}
        transition={{ duration: 0.15 }}
        className="relative"
      >
        {connected && celebration > 0 && !reduceMotion && (
          <motion.span
            key={`ripple-${celebration}`}
            aria-hidden="true"
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.35 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-emerald-500"
          />
        )}
        {connected ? (
          <Link
            to="/integration"
            title={names.join(', ')}
            aria-label={t('int.statusConnectedAria', { names: names.join(', ') })}
            className={`${chip} relative overflow-hidden border-emerald-300 bg-emerald-50 text-emerald-800 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.45)] hover:brightness-95 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300`}
          >
            {celebration > 0 && !reduceMotion && (
              <motion.span
                key={`shine-${celebration}`}
                aria-hidden="true"
                initial={{ x: '-120%' }}
                animate={{ x: '320%' }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/70 to-transparent"
              />
            )}
            <span className="flex -space-x-1.5" aria-hidden="true">
              <AnimatePresence initial={false}>
                {apps.slice(0, 3).map((app) => (
                  <motion.span
                    key={app.id}
                    layout={!reduceMotion}
                    initial={pop}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={pop}
                    transition={spring}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-fg ring-2 ring-emerald-50 dark:ring-surface"
                  >
                    <IntegrationLogo id={app.id} className="h-3.5 w-3.5" />
                  </motion.span>
                ))}
              </AnimatePresence>
            </span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={label}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
                className="hidden max-w-40 truncate md:inline"
              >
                {label}
              </motion.span>
            </AnimatePresence>
            <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
          </Link>
        ) : (
          <Link
            to="/integration"
            aria-label={t('int.statusNoneAria')}
            className={`${chip} border-dashed border-line text-muted hover:border-accent/50 hover:text-fg`}
          >
            <span className="[&>svg]:h-4 [&>svg]:w-4">
              <IntegrationIcon />
            </span>
            <span className="hidden md:inline">{t('int.statusNone')}</span>
          </Link>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
