import { useCallback, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import LogoutDialog from '@/components/layout/LogoutDialog'
import { LogoutIcon, SettingsIcon } from '@/components/ui/icons'
import { useDismissable } from '@/hooks/useDismissable'
import { useProfile } from '@/features/account/store/accountStore'
import { useSession } from '@/features/auth/store/authStore'
import { useI18n } from '@/lib/i18n'

const menuItem =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4'

export default function ProfileMenu() {
  const { t } = useI18n()
  const profile = useProfile()
  const role = useSession()?.role
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  const close = useCallback(() => setOpen(false), [])
  useDismissable(open, close, rootRef, buttonRef)

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('header.profile')}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <img src={profile.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-accent/30" />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-line bg-surface p-3 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <img src={profile.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{profile.fullName}</p>
              <p className="truncate text-xs text-muted">{profile.email}</p>
            </div>
          </div>
          {role && (
            <span className="mt-3 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-fg">
              {t(role === 'teacher' ? 'role.teacher' : 'role.student')}
            </span>
          )}

          <div className="-mx-1 mt-3 border-t border-line pt-2">
            <Link to="/account" onClick={() => setOpen(false)} className={menuItem}>
              <SettingsIcon />
              {t('header.accountSettings')}
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setConfirmingLogout(true)
              }}
              className={menuItem}
            >
              <LogoutIcon />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      )}

      <LogoutDialog open={confirmingLogout} onClose={() => setConfirmingLogout(false)} />
    </div>
  )
}
