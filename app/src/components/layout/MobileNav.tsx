import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import LogoutDialog from '@/components/layout/LogoutDialog'
import { integrationNavItem, navItemsFor } from '@/components/layout/navItems'
import { CloseIcon, LogoutIcon, SettingsIcon } from '@/components/ui/icons'
import LogoMark from '@/components/ui/LogoMark'
import { useSession } from '@/features/auth/store/authStore'
import { useI18n } from '@/lib/i18n'

interface Props {
  open: boolean
  onClose: () => void
}

const item = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-5 [&>svg]:w-5 ${
    isActive ? 'bg-accent-soft text-accent-fg' : 'text-muted hover:bg-hover hover:text-fg'
  }`

/**
 * The navigation on small screens: the icon rail would be cramped, so it opens as a drawer with labels.
 * The panel slides in, the dimmed background fades, and the links follow one after another.
 */
export default function MobileNav({ open, onClose }: Props) {
  const { t } = useI18n()
  const role = useSession()?.role
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDialogElement>(null)
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  // The native <dialog> provides focus trapping and Escape. It stays open while the drawer slides out, and is
  // closed once that animation has finished (see onExitComplete below).
  useEffect(() => {
    const dialog = ref.current
    if (open && dialog && !dialog.open) dialog.showModal()
  }, [open])

  // The drawer is for small screens only, so it closes if the window grows wide enough for the rail.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 768px)')
    const onChange = (e: MediaQueryListEvent) => e.matches && onClose()
    wide.addEventListener('change', onChange)
    return () => wide.removeEventListener('change', onChange)
  }, [onClose])

  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
  // Each link slides in a little after the one above it.
  const appear = (index: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, x: -14 },
          animate: { opacity: 1, x: 0, transition: { delay: 0.1 + index * 0.04, duration: 0.2 } },
        }

  const links = navItemsFor(role)
  const showIntegration = Boolean(role && integrationNavItem.roles.includes(role))

  return (
    <>
      {/* The dialog covers the screen but draws nothing itself: the backdrop and panel below are animated. */}
      <dialog
        ref={ref}
        onCancel={(e) => {
          e.preventDefault()
          onClose()
        }}
        aria-label={t('nav.main')}
        className="m-0 h-dvh max-h-dvh w-screen max-w-none overflow-hidden bg-transparent p-0 text-fg backdrop:bg-transparent open:block"
      >
        <AnimatePresence onExitComplete={() => ref.current?.close()}>
          {open && (
            <>
              <motion.div
                key="backdrop"
                aria-hidden="true"
                {...fade}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40"
              />
              <motion.div
                key="panel"
                initial={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
                animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 38 }}
                className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-rail shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-accent-strong to-violet-500 text-sm font-bold text-white shadow-sm"
                      aria-hidden="true"
                    >
                      <LogoMark className="h-4 w-4" />
                    </span>
                    <span className="text-base font-semibold">ReanTask</span>
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('dialog.close')}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-5 [&>svg]:w-5"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <nav aria-label={t('nav.main')} className="flex-1 space-y-1 overflow-y-auto p-3">
                  {links.map((link, index) => (
                    <motion.div key={link.to} {...appear(index)}>
                      <NavLink to={link.to} onClick={onClose} className={item}>
                        {link.icon}
                        {t(link.labelKey)}
                      </NavLink>
                    </motion.div>
                  ))}
                </nav>

                <div className="space-y-1 border-t border-line p-3">
                  {showIntegration && (
                    <motion.div {...appear(links.length)}>
                      <NavLink to={integrationNavItem.to} onClick={onClose} className={item}>
                        {integrationNavItem.icon}
                        {t(integrationNavItem.labelKey)}
                      </NavLink>
                    </motion.div>
                  )}
                  <motion.div {...appear(links.length + 1)}>
                    <NavLink to="/settings" onClick={onClose} className={item}>
                      <SettingsIcon />
                      {t('nav.settings')}
                    </NavLink>
                  </motion.div>
                  <motion.div {...appear(links.length + 2)}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        setConfirmingLogout(true)
                      }}
                      aria-haspopup="dialog"
                      className={`${item({ isActive: false })} w-full text-left`}
                    >
                      <LogoutIcon />
                      {t('nav.logout')}
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </dialog>

      <LogoutDialog open={confirmingLogout} onClose={() => setConfirmingLogout(false)} />
    </>
  )
}
