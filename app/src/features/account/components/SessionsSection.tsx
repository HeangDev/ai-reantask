import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { LogoutIcon, MonitorIcon } from '@/shared/components/icons'
import { useToast } from '@/shared/components/Toast'
import { OtherSessionsTable } from '@/features/account/components/OtherSessionsTable'
import { SectionCard } from '@/features/account/components/SectionCard'
import { SessionCard } from '@/features/account/components/SessionCard'
import type { LoginSession } from '@/features/account/types'
import { useRevokeOtherSessions, useRevokeSession, useSessions } from '@/features/account/api/useSessions'
import { useLogoutAll } from '@/features/auth'
import { useMe } from '@/features/auth'
import { authActions } from '@/shared/store/authStore'
import { useI18n } from '@/shared/i18n'
import { paths } from '@/shared/config/paths'

const outlineButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40'

/** This device first, in full; any other devices below it as a compact table with a way to sign them all out at once. */
export function SessionsSection() {
  const { t } = useI18n()
  const me = useMe()
  const sessionsQuery = useSessions(me.data?.id)
  const sessions = sessionsQuery.data
  const current = sessions?.find((s) => s.isCurrent)
  const others = sessions?.filter((s) => !s.isCurrent) ?? []
  const [confirmingAll, setConfirmingAll] = useState(false)
  const [confirmingOthers, setConfirmingOthers] = useState(false)
  const { notify } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logoutAll = useLogoutAll()
  const revokeSession = useRevokeSession()
  const revokeOthers = useRevokeOtherSessions()
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

  const signOutOthers = () => {
    if (revokeOthers.isPending) return
    revokeOthers.mutate(
      others.map((s) => s.id),
      {
        onSuccess: () => notify({ title: t('acct.othersLoggedOut'), subtitle: t('acct.othersLoggedOutDesc') }),
        onError: () => notify({ variant: 'danger', title: t('acct.deviceLogoutFailed'), subtitle: t('acct.passwordFailedDesc') }),
        onSettled: () => setConfirmingOthers(false),
      },
    )
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
          <div className="space-y-5">
            {current && <SessionCard session={current} />}

            {others.length > 0 && (
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    {t('acct.otherDevices')}
                    <span className="ml-2 rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-muted">{others.length}</span>
                  </h3>
                  {others.length > 1 && (
                    <button
                      type="button"
                      disabled={revokeOthers.isPending}
                      onClick={() => setConfirmingOthers(true)}
                      aria-haspopup="dialog"
                      className={outlineButton}
                    >
                      {t('acct.logoutOthers')}
                    </button>
                  )}
                </div>
                <OtherSessionsTable sessions={others} disabled={revokeSession.isPending} onSignOut={setRevoking} />
              </div>
            )}
          </div>
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
          open={confirmingOthers}
          icon={<LogoutIcon />}
          title={t('acct.logoutOthersTitle', { count: String(others.length) })}
          message={t('acct.logoutOthersMessage')}
          confirmLabel={t('acct.logoutOthers')}
          onCancel={() => setConfirmingOthers(false)}
          onConfirm={signOutOthers}
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
    </div>
  )
}
