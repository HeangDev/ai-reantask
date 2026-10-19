import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { LogoutIcon } from '@/shared/components/icons'
import { useProfile } from '@/features/auth/api/useProfile'
import { useSignOut } from '@/features/auth/api/useAuthMutations'
import { useI18n } from '@/shared/i18n'
import { paths } from '@/shared/config/paths'

interface Props {
  open: boolean
  onClose: () => void
}

/** Logout confirmation shared by the sidebar and the profile menu. */
export function LogoutDialog({ open, onClose }: Props) {
  const { t } = useI18n()
  const profile = useProfile()
  const navigate = useNavigate()
  const signOut = useSignOut()

  return (
    <ConfirmDialog
      open={open}
      icon={<LogoutIcon />}
      title={t('logout.title')}
      message={t('logout.message')}
      confirmLabel={t('nav.logout')}
      onCancel={onClose}
      onConfirm={() => {
        onClose()
        signOut.mutate()
        void navigate(paths.login)
      }}
    >
      <div className="flex items-center gap-3 rounded-lg border border-line bg-sunken p-3">
        <img src={profile.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{profile.fullName}</p>
          <p className="truncate text-xs text-muted">{profile.email}</p>
        </div>
      </div>
    </ConfirmDialog>
  )
}
