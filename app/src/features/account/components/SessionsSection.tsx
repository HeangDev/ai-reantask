import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LogoutDialog } from '@/features/auth'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { LogoutIcon, MonitorIcon, PhoneIcon } from '@/shared/components/icons'
import { useToast } from '@/shared/components/Toast'
import { SectionCard } from '@/features/account/components/SectionCard'
import type { LoginSession } from '@/features/account/types'
import { useRevokeSession, useSessions } from '@/features/account/api/useSessions'
import { useLogoutAll } from '@/features/auth'
import { useMe } from '@/features/auth'
import { authActions } from '@/shared/store/authStore'
import { useI18n } from '@/shared/i18n'
import { formatTimeAgo } from '@/shared/lib/timeAgo'
import { paths } from '@/shared/config/paths'

const outlineButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40'

export function SessionsSection() {
  const { t, locale } = useI18n()
  const me = useMe()
  const sessionsQuery = useSessions(me.data?.id)
  const sessions = sessionsQuery.data
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [confirmingAll, setConfirmingAll] = useState(false)
  const { notify } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logoutAll = useLogoutAll()
  const revokeSession = useRevokeSession()
  const [revoking, setRevoking] = useState<LoginSession | null>(null)

  // Another device is signed out: its token stops working at once; this device stays signed in.
  const signOutDevice = () => {
    if (!revoking || revokeSession.isPending) return
    const device = revoking.device || t('acct.unknownDevice')
    revokeSession.mutate(revoking.id, {
      onSuccess: () => notify({ title: t('acct.deviceLoggedOut'), subtitle: t('acct.deviceLoggedOutDesc', { device }) }),
      onError: () => notify({ variant: 'danger', title: t('acct.deviceLogoutFailed'), subtitle: t('acct.passwordFailedDesc') }),
      onSettled: () => setRevoking(null),
    })
  }

  // Every token is revoked, this device's included, so the person is signed out here too.
  const signOutEverywhere = () =>
    logoutAll.mutate(undefined, {
      onSuccess: () => {
        setConfirmingAll(false)
        authActions.signOut()
        queryClient.clear()
        void navigate(paths.login)
      },
      onError: () => {
        setConfirmingAll(false)
        notify({ variant: 'danger', title: t('acct.logoutAllFailed'), subtitle: t('acct.passwordFailedDesc') })
      },
    })

  return (
    <div className="space-y-5">
      <SectionCard title={t('acct.sessionsTitle')} description={t('acct.sessionsDesc')} icon={<MonitorIcon />}>
        {sessionsQuery.isError || me.isError ? (
          <>
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {t('acct.sessionsLoadFailed')}
            </p>
            <button
              type="button"
              onClick={() => void (me.isError ? me.refetch() : sessionsQuery.refetch())}
              className={`${outlineButton} mt-3`}
            >
              {t('dash.retry')}
            </button>
          </>
        ) : !sessions ? (
          <p role="status" className="text-sm text-muted">
            {t('acct.sessionsLoading')}
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted">{t('acct.noSessions')}</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-center gap-3 bg-surface p-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-muted [&>svg]:h-5 [&>svg]:w-5"
                >
                  {session.kind === 'phone' ? <PhoneIcon /> : <MonitorIcon />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {session.device || t('acct.unknownDevice')}
                    {session.isCurrent && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        {t('acct.thisDevice')}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {session.isCurrent ? t('acct.activeNow') : formatTimeAgo(session.lastActiveAt, locale)}
                  </p>
                </div>
                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => setRevoking(session)}
                    aria-haspopup="dialog"
                    aria-label={t('acct.deviceLogoutLabel', { device: session.device || t('acct.unknownDevice') })}
                    disabled={revokeSession.isPending}
                    className={`${outlineButton} shrink-0`}
                  >
                    {t('acct.deviceLogout')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={logoutAll.isPending}
            onClick={() => setConfirmingAll(true)}
            aria-haspopup="dialog"
            className={`${outlineButton} text-red-600 dark:text-red-400`}
          >
            {t('acct.logoutAll')}
          </button>
        </div>
        <ConfirmDialog
          open={revoking !== null}
          icon={<LogoutIcon />}
          title={t('acct.deviceLogoutTitle')}
          message={t('acct.deviceLogoutMessage', { device: revoking?.device || t('acct.unknownDevice') })}
          confirmLabel={t('acct.deviceLogout')}
          onCancel={() => setRevoking(null)}
          onConfirm={signOutDevice}
        />
        <ConfirmDialog
          open={confirmingAll}
          icon={<LogoutIcon />}
          title={t('acct.logoutAllTitle')}
          message={t('acct.logoutAllMessage')}
          confirmLabel={t('acct.logoutAll')}
          onCancel={() => setConfirmingAll(false)}
          onConfirm={signOutEverywhere}
        />
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
