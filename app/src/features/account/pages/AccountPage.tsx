import { useState } from 'react'
import type { ReactNode } from 'react'
import { LockIcon, MonitorIcon, TrashIcon, UserIcon } from '@/shared/components/icons'
import { DeleteAccountSection } from '@/features/account/components/DeleteAccountSection'
import { PasswordSection } from '@/features/account/components/PasswordSection'
import { ProfileSection } from '@/features/account/components/ProfileSection'
import { SessionsSection } from '@/features/account/components/SessionsSection'
import { useProfile } from '@/features/auth'
import { roleLabelKey } from '@/features/auth'
import { useSession } from '@/shared/store/authStore'
import type { AccountTab } from '@/features/account/types'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

const tabs: { value: AccountTab; labelKey: TranslationKey; icon: ReactNode }[] = [
  { value: 'profile', labelKey: 'acct.tabProfile', icon: <UserIcon /> },
  { value: 'security', labelKey: 'acct.tabSecurity', icon: <LockIcon /> },
  { value: 'sessions', labelKey: 'acct.tabSessions', icon: <MonitorIcon /> },
  { value: 'delete', labelKey: 'acct.tabDelete', icon: <TrashIcon /> },
]

export function AccountPage() {
  const { t } = useI18n()
  const profile = useProfile()
  const role = useSession()?.role
  const [tab, setTab] = useState<AccountTab>('profile')

  return (
    <section className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{t('header.accountSettings')}</h1>
      <p className="mt-1 text-sm text-muted">{t('acct.desc')}</p>

      <div className="mt-5 flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
        <img src={profile.avatarUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{profile.fullName}</p>
          <p className="truncate text-sm text-muted">{profile.email}</p>
          {role && (
            <span className="mt-1 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-fg">
              {t(roleLabelKey[role])}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label={t('header.accountSettings')} className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map((item) => {
            const active = tab === item.value
            const danger = item.value === 'delete'
            return (
              <button
                key={item.value}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setTab(item.value)}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4 ${
                  active
                    ? danger
                      ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                      : 'bg-accent-soft text-accent-fg'
                    : danger
                      ? 'text-red-600 hover:bg-hover dark:text-red-400'
                      : 'text-muted hover:bg-hover hover:text-fg'
                }`}
              >
                {item.icon}
                {t(item.labelKey)}
              </button>
            )
          })}
        </nav>

        <div className={`space-y-5 ${tab === 'sessions' ? '' : 'max-w-2xl'}`}>
          {tab === 'profile' && <ProfileSection />}
          {tab === 'security' && <PasswordSection />}
          {tab === 'sessions' && <SessionsSection />}
          {tab === 'delete' && <DeleteAccountSection />}
        </div>
      </div>
    </section>
  )
}
