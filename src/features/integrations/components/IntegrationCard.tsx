import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Switch from '@/components/ui/Switch'
import IntegrationLogo from '@/features/integrations/components/IntegrationLogo'
import type { Integration } from '@/features/integrations/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  integration: Integration
  connected: boolean
  onToggle: () => void
  /** Position in the grid, used to stagger the entrance. */
  index?: number
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export default function IntegrationCard({ integration, connected, onToggle, index = 0 }: Props) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const motionOn = !reduceMotion

  return (
    <motion.li
      layout={motionOn}
      initial={motionOn ? { opacity: 0, y: 16 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: motionOn ? index * 0.06 : 0 }}
      whileHover={motionOn ? { y: -2 } : undefined}
      className={`relative flex flex-col overflow-hidden rounded-xl border bg-surface transition-[border-color,box-shadow] duration-300 ${
        connected
          ? 'border-emerald-300 shadow-[0_6px_24px_-8px_rgba(16,185,129,0.35)] dark:border-emerald-500/40'
          : 'border-line'
      }`}
    >
      {/* Accent line that sweeps across the top once connected. */}
      <AnimatePresence initial={false}>
        {connected && (
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
            className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-emerald-400 via-emerald-500 to-teal-400"
          />
        )}
      </AnimatePresence>

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <motion.span
            animate={connected && motionOn ? { scale: [1, 1.18, 1], rotate: [0, -6, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-sunken"
          >
            <IntegrationLogo id={integration.id} />
            {/* Ripple that expands from the logo at the moment of connecting. */}
            <AnimatePresence initial={false}>
              {connected && motionOn && (
                <motion.span
                  aria-hidden="true"
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ opacity: 0, scale: 2.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="pointer-events-none absolute inset-0 rounded-lg border-2 border-emerald-500"
                />
              )}
            </AnimatePresence>
          </motion.span>

          <AnimatePresence initial={false}>
            {connected && (
              <motion.span
                initial={motionOn ? { opacity: 0, scale: 0.6, x: 8 } : { opacity: 0 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={motionOn ? { opacity: 0, scale: 0.6, x: 8 } : { opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <motion.path
                    d="m5 12 5 5L20 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: motionOn ? 0 : 1 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  />
                </svg>
                {t('int.tabConnected')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <h3 className="mt-3 font-semibold">{integration.name}</h3>
        <p className="mt-1 text-sm text-muted">{t(integration.descriptionKey)}</p>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-sunken px-4 py-3">
        <motion.button
          type="button"
          onClick={onToggle}
          whileTap={motionOn ? { scale: 0.95 } : undefined}
          className={`flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover ${focusRing}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M17 3l4 4-4 4M21 7H8M7 21l-4-4 4-4M3 17h13" />
          </svg>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={connected ? 'disconnect' : 'connect'}
              initial={motionOn ? { opacity: 0, y: 6 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={motionOn ? { opacity: 0, y: -6 } : { opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {connected ? t('int.disconnect') : t('int.connect')}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <Switch
          checked={connected}
          onChange={onToggle}
          label={t('int.toggle', { name: integration.name })}
        />
      </div>
    </motion.li>
  )
}
