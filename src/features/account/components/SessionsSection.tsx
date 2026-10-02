import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import LogoutDialog from '@/components/layout/LogoutDialog'
import { LogoutIcon, MonitorIcon, PhoneIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import SectionCard from '@/features/account/components/SectionCard'
import { accountService } from '@/features/account/services/accountService'
import { accountActions, useSessions } from '@/features/account/store/accountStore'
import { useI18n } from '@/lib/i18n'
import { formatTimeAgo } from '@/lib/timeAgo'

const outlineButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40'

export default function SessionsSection() {
  const { t, locale } = useI18n()
  const { notify } = useToast()
  const reduceMotion = useReducedMotion()
  const sessions = useSessions()
  const [pending, setPending] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const others = sessions.filter((s) => !s.isCurrent)

  const revoke = async (ids: string[], title: string, subtitle: string) => {
    if (pending) return
    setPending(true)
    try {
      await accountService.revokeSessions(ids)
      accountActions.removeSessions(new Set(ids))
      notify({ variant: 'danger', title, subtitle })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard title={t('acct.sessionsTitle')} description={t('acct.sessionsDesc')} icon={<MonitorIcon />}>
        <ul className="divide-y divide-line rounded-lg border border-line">
          <AnimatePresence initial={false}>
            {sessions.map((session) => (
              <motion.li
                key={session.id}
                layout={!reduceMotion}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 bg-surface p-3"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-muted [&>svg]:h-5 [&>svg]:w-5"
                >
                  {session.kind === 'phone' ? <PhoneIcon /> : <MonitorIcon />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {session.device}
                    {session.isCurrent && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        {t('acct.thisDevice')}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {session.location} ·{' '}
                    {session.isCurrent ? t('acct.activeNow') : formatTimeAgo(session.lastActiveAt, locale)}
                  </p>
                </div>
                {!session.isCurrent && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      revoke(
                        [session.id],
                        t('acct.sessionRevoked'),
                        t('acct.sessionRevokedDesc', { device: session.device }),
                      )
                    }
                    className={outlineButton}
                  >
                    {t('acct.revoke')}
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">{others.length === 0 ? t('acct.noOtherSessions') : ''}</p>
          <button
            type="button"
            disabled={pending || others.length === 0}
            onClick={() =>
              revoke(
                others.map((s) => s.id),
                t('acct.allRevoked'),
                t('acct.allRevokedDesc', { count: String(others.length) }),
              )
            }
            className={`${outlineButton} text-red-600 dark:text-red-400`}
          >
            {t('acct.revokeAll')}
          </button>
        </div>
      </SectionCard>

      <SectionCard title={t('nav.logout')} description={t('acct.logoutDesc')} icon={<LogoutIcon />}>
        <button type="button" onClick={() => setConfirmingLogout(true)} aria-haspopup="dialog" className={outlineButton}>
          {t('nav.logout')}
        </button>
        <LogoutDialog open={confirmingLogout} onClose={() => setConfirmingLogout(false)} />
      </SectionCard>
    </div>
  )
}
