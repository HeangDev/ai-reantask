import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { navItems } from '@/components/layout/navItems'
import { LogoutIcon, SettingsIcon } from '@/components/ui/icons'
import { currentUser } from '@/lib/currentUser'
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
  const navigate = useNavigate()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <aside className="flex w-11 shrink-0 flex-col items-center border-r border-line bg-rail py-2.5">
      <span
        className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-accent-strong to-violet-500 text-sm font-bold text-white shadow-sm"
        aria-hidden="true"
      >
        A
      </span>

      <nav aria-label={t('nav.main')} className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={railLink} aria-label={t(item.labelKey)}>
            {item.icon}
            <RailLabel>{t(item.labelKey)}</RailLabel>
          </NavLink>
        ))}
      </nav>

      <NavLink to="/settings" className={railLink} aria-label={t('nav.settings')}>
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

      <ConfirmDialog
        open={confirmingLogout}
        icon={<LogoutIcon />}
        title={t('logout.title')}
        message={t('logout.message')}
        confirmLabel={t('nav.logout')}
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={() => {
          setConfirmingLogout(false)
          navigate('/login')
        }}
      >
        <div className="flex items-center gap-3 rounded-lg border border-line bg-sunken p-3">
          <img src={currentUser.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{currentUser.fullName}</p>
            <p className="truncate text-xs text-muted">{currentUser.email}</p>
          </div>
        </div>
      </ConfirmDialog>
    </aside>
  )
}
