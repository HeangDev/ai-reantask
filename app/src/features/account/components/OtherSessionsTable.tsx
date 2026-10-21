import { MonitorIcon, PhoneIcon } from '@/shared/components/icons'
import type { LoginSession } from '@/features/account/types'
import { useI18n } from '@/shared/i18n'
import { formatTimeAgo } from '@/shared/lib/timeAgo'

interface Props {
  sessions: LoginSession[]
  disabled: boolean
  onSignOut: (session: LoginSession) => void
}

const outlineButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40'
const head = 'px-3 py-2 text-left text-xs font-medium text-muted'

/** The other signed-in devices as one compact row each. On small screens a row turns into a stacked card. */
export function OtherSessionsTable({ sessions, disabled, onSignOut }: Props) {
  const { t, locale } = useI18n()
  const unknown = t('acct.sessionUnknown')

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="block w-full text-sm lg:table">
        <caption className="sr-only">{t('acct.otherDevices')}</caption>
        <thead className="sr-only lg:not-sr-only lg:table-header-group">
          <tr className="border-b border-line bg-sunken lg:table-row">
            <th scope="col" className={head}>{t('acct.sessionSystem')}</th>
            <th scope="col" className={head}>{t('acct.sessionLocation')}</th>
            <th scope="col" className={head}>{t('acct.sessionIp')}</th>
            <th scope="col" className={head}>{t('acct.sessionTime')}</th>
            <th scope="col" className={head}><span className="sr-only">{t('stu.colActions')}</span></th>
          </tr>
        </thead>
        <tbody className="block divide-y divide-line lg:table-row-group">
          {sessions.map((s) => {
            const system = [s.os, s.browser].filter(Boolean).join(' · ') || t('acct.unknownDevice')
            const label = (text: string) => <span className="mr-1 text-xs text-muted lg:hidden">{text}:</span>
            return (
              <tr key={s.id} className="block space-y-1 bg-surface p-3 lg:table-row lg:space-y-0 lg:p-0">
                <td className="block lg:table-cell lg:px-3 lg:py-3">
                  <span className="flex items-center gap-2 font-medium">
                    <span aria-hidden="true" className="text-muted [&>svg]:h-4 [&>svg]:w-4">
                      {s.kind === 'phone' ? <PhoneIcon /> : <MonitorIcon />}
                    </span>
                    <span className="truncate">{system}</span>
                  </span>
                </td>
                <td className="block text-muted lg:table-cell lg:px-3 lg:py-3">
                  {label(t('acct.sessionLocation'))}
                  {s.location || unknown}
                </td>
                <td className="block text-muted lg:table-cell lg:px-3 lg:py-3">
                  {label(t('acct.sessionIp'))}
                  {s.ipAddress || unknown}
                </td>
                <td className="block text-muted lg:table-cell lg:whitespace-nowrap lg:px-3 lg:py-3">
                  {label(t('acct.sessionTime'))}
                  <time
                    dateTime={new Date(s.lastActiveAt).toISOString()}
                    title={new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(s.lastActiveAt)}
                  >
                    {formatTimeAgo(s.lastActiveAt, locale)}
                  </time>
                </td>
                <td className="block pt-2 lg:table-cell lg:px-3 lg:py-3 lg:pt-3 lg:text-right">
                  <button
                    type="button"
                    onClick={() => onSignOut(s)}
                    aria-haspopup="dialog"
                    aria-label={t('acct.deviceLogoutLabel', { device: s.device || t('acct.unknownDevice') })}
                    disabled={disabled}
                    className={outlineButton}
                  >
                    {t('acct.deviceLogout')}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
