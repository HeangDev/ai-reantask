import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { LogoutIcon } from '@/components/ui/icons'
import { useProfile } from '@/features/account/store/accountStore'
import { authActions } from '@/features/auth/store/authStore'
import { useI18n } from '@/lib/i18n'

interface Props {
  open: boolean
  onClose: () => void
}

/** Logout confirmation shared by the sidebar and the profile menu. */
export default function LogoutDialog({ open, onClose }: Props) {
  const { t } = useI18n()
  const profile = useProfile()
  const navigate = useNavigate()

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
        authActions.signOut()
        navigate('/login')
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
