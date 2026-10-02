import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import LogoutDialog from '@/components/layout/LogoutDialog'
import { integrationNavItem, navItemsFor } from '@/components/layout/navItems'
import { LogoutIcon, SettingsIcon } from '@/components/ui/icons'
import { useSession } from '@/features/auth/store/authStore'
import { useI18n } from '@/lib/i18n'

const railLink = ({ isActive }: { isActive: boolean }) =>
  `group relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors [&>svg]:h-4 [&>svg]:w-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
    isActive
      ? 'bg-accent-soft text-accent-fg ring-1 ring-inset ring-accent/40 before:absolute before:-left-1.5 before:top-1/2 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-accent before:shadow-[0_0_8px_var(--accent)]'
      : 'text-muted hover:bg-hover hover:text-fg'
  }`

// Label shown to the right of the rail on hover/focus. The link itself carries the aria-label.
function RailLabel({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-full z-30 ml-3 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium text-fg opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  )
}

export default function Sidebar() {
  const { t } = useI18n()
  const role = useSession()?.role
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <aside className="hidden w-11 shrink-0 flex-col items-center md:flex border-r border-line bg-rail py-2.5">
      <span
        className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-accent-strong to-violet-500 text-sm font-bold text-white shadow-sm"
        aria-hidden="true"
      >
        A
      </span>

      <nav aria-label={t('nav.main')} className="flex flex-1 flex-col items-center gap-1">
        {navItemsFor(role).map((item) => (
          <NavLink key={item.to} to={item.to} className={railLink} aria-label={t(item.labelKey)}>
            {item.icon}
            <RailLabel>{t(item.labelKey)}</RailLabel>
          </NavLink>
        ))}
      </nav>

      {role && integrationNavItem.roles.includes(role) && (
        <NavLink
          to={integrationNavItem.to}
          className={railLink}
          aria-label={t(integrationNavItem.labelKey)}
        >
          {integrationNavItem.icon}
          <RailLabel>{t(integrationNavItem.labelKey)}</RailLabel>
        </NavLink>
      )}

      <NavLink
        to="/settings"
        className={(state) => `${railLink(state)} mt-1`}
        aria-label={t('nav.settings')}
      >
        <SettingsIcon />
        <RailLabel>{t('nav.settings')}</RailLabel>
      </NavLink>

      <button
        type="button"
        onClick={() => setConfirmingLogout(true)}
        aria-label={t('nav.logout')}
        aria-haspopup="dialog"
        className={`${railLink({ isActive: false })} mt-1`}
      >
        <LogoutIcon />
        <RailLabel>{t('nav.logout')}</RailLabel>
      </button>

      <LogoutDialog open={confirmingLogout} onClose={() => setConfirmingLogout(false)} />
    </aside>
  )
}
