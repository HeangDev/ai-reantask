import Avatar from '@/components/ui/Avatar'
import { EditIcon, TrashIcon } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal'
import AccountStatusBadge from '@/features/users/components/AccountStatusBadge'
import type { User } from '@/features/users/types'
import { formatDate } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

interface Props {
  user: User
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

const actionClass =
  'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4'

export default function UserDetail({ user, onEdit, onDelete, onClose }: Props) {
  const { t, locale } = useI18n()

  return (
    <Modal title={t('usr.details')} onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{user.fullName}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <dl className="mt-5 divide-y divide-line rounded-lg border border-line text-sm">
          <div className="flex justify-between gap-4 px-3 py-2">
            <dt className="text-muted">{t('stu.fieldPhone')}</dt>
            <dd className="font-medium">{user.phone}</dd>
          </div>
          <div className="flex justify-between gap-4 px-3 py-2">
            <dt className="text-muted">{t('usr.role')}</dt>
            <dd className="font-medium">{user.role}</dd>
          </div>
          <div className="flex justify-between gap-4 px-3 py-2">
            <dt className="text-muted">{t('usr.status')}</dt>
            <dd className="font-medium"><AccountStatusBadge status={user.status} /></dd>
          </div>
          <div className="flex justify-between gap-4 px-3 py-2">
            <dt className="text-muted">{t('usr.colLastLogin')}</dt>
            <dd className="font-medium">{user.lastLogin ? formatDate(user.lastLogin, locale) : t('stu.noVisit')}</dd>
          </div>
        </dl>
      </div>
      <div className="flex justify-end gap-2 border-t border-line bg-sunken px-5 py-3">
        <button
          type="button"
          onClick={onDelete}
          className={`${actionClass} border border-line bg-surface text-red-600 hover:bg-hover dark:text-red-400`}
        >
          <TrashIcon />
          {t('stu.delete')}
        </button>
        <button type="button" onClick={onEdit} className={`${actionClass} bg-accent-strong text-white hover:brightness-110`}>
          <EditIcon />
          {t('stu.edit')}
        </button>
      </div>
    </Modal>
  )
}
