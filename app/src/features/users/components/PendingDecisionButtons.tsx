import { CheckIcon, CloseIcon } from '@/shared/components/icons'
import { useToast } from '@/shared/components/Toast'
import { useApproveUser, useRejectUser } from '@/features/users/api/useUsers'
import type { User } from '@/features/users/types'
import { useI18n } from '@/shared/i18n'

const decisionButton =
  'rounded-md p-1.5 text-white transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-40 [&>svg]:h-4 [&>svg]:w-4'

/** Approve and Reject for a student who registered and is waiting (status PENDING). Reject suspends the account. */
export function PendingDecisionButtons({ user }: { user: User }) {
  const { t } = useI18n()
  const { notify } = useToast()
  const approve = useApproveUser()
  const reject = useRejectUser()
  const deciding = approve.isPending || reject.isPending

  const approveStudent = () => {
    if (deciding) return
    approve.mutate(user.id, {
      onSuccess: () => notify({ title: t('reg.approvedToast'), subtitle: t('reg.approvedToastDesc', { name: user.fullName }) }),
      onError: () => notify({ variant: 'danger', title: t('usr.approveFailed'), subtitle: t('usr.tryAgain') }),
    })
  }

  const rejectStudent = () => {
    if (deciding) return
    reject.mutate(user.id, {
      onSuccess: () => notify({ variant: 'danger', title: t('reg.declinedToast'), subtitle: t('reg.declinedToastDesc', { name: user.fullName }) }),
      onError: () => notify({ variant: 'danger', title: t('usr.rejectFailed'), subtitle: t('usr.tryAgain') }),
    })
  }

  return (
    <>
      <button
        type="button"
        disabled={deciding}
        onClick={approveStudent}
        aria-label={`${t('joinreq.approve')}: ${user.fullName}`}
        title={t('joinreq.approve')}
        className={`${decisionButton} bg-accent-strong`}
      >
        <CheckIcon />
      </button>
      <button
        type="button"
        disabled={deciding}
        onClick={rejectStudent}
        aria-label={`${t('joinreq.decline')}: ${user.fullName}`}
        title={t('joinreq.decline')}
        className={`${decisionButton} bg-red-600 dark:bg-red-500`}
      >
        <CloseIcon />
      </button>
    </>
  )
}
