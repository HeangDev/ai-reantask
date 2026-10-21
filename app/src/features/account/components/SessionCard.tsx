import { MonitorIcon, PhoneIcon } from '@/shared/components/icons'
import type { LoginSession } from '@/features/account/types'
import { useI18n } from '@/shared/i18n'

/** The device in use now, shown in full: where, which IP, which system and when. */
export function SessionCard({ session }: { session: LoginSession }) {
  const { t, locale } = useI18n()
  const unknown = t('acct.sessionUnknown')
  const system = [session.os, session.browser].filter(Boolean).join(' · ')
  const details = [
    { label: t('acct.sessionLocation'), value: session.location || unknown },
    { label: t('acct.sessionIp'), value: session.ipAddress || unknown },
    { label: t('acct.sessionSystem'), value: system || unknown },
    { label: t('acct.sessionTime'), value: t('acct.activeNow') },
  ]

  return (
    <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-500/40 dark:bg-emerald-500/5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 [&>svg]:h-5 [&>svg]:w-5"
        >
          {session.kind === 'phone' ? <PhoneIcon /> : <MonitorIcon />}
        </span>
        <p className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm font-semibold">
          {t(session.kind === 'phone' ? 'acct.sessionPhone' : 'acct.sessionComputer')}
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            {t('acct.thisDevice')}
          </span>
        </p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-emerald-200 pt-3 text-sm dark:border-emerald-500/20 lg:grid-cols-4">
        {details.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-0.5 truncate font-medium" title={value}>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">
        <time dateTime={new Date(session.lastActiveAt).toISOString()}>
          {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(session.lastActiveAt)}
        </time>
      </p>
    </div>
  )
}
