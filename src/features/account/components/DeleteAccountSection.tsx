import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrashIcon } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import SectionCard from '@/features/account/components/SectionCard'
import TextField from '@/components/ui/TextField'
import { accountService } from '@/features/account/services/accountService'
import { authActions } from '@/features/auth/store/authStore'
import { useI18n } from '@/lib/i18n'

// Typed literally (not translated) so the confirmation is the same in every language.
const CONFIRM_WORD = 'DELETE'

function DeleteModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const ready = typed === CONFIRM_WORD

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!ready || deleting) return
    setDeleting(true)
    try {
      await accountService.deleteAccount()
      notify({ variant: 'danger', title: t('acct.accountDeleted'), subtitle: t('acct.accountDeletedDesc') })
      authActions.signOut()
      navigate('/login')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal title={t('acct.deleteTitle')} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        <p className="text-sm text-muted">{t('acct.deleteModalMsg')}</p>
        <TextField
          label={t('acct.deleteTypePrompt', { word: CONFIRM_WORD })}
          autoComplete="off"
          value={typed}
          onChange={setTyped}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('dialog.cancel')}
          </button>
          <button
            type="submit"
            disabled={!ready || deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-red-600/30 transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? t('acct.saving') : t('acct.deleteConfirm')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function DeleteAccountSection() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <SectionCard title={t('acct.deleteTitle')} description={t('acct.deleteDesc')} icon={<TrashIcon />} danger>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-red-600/30 transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
      >
        {t('acct.deleteButton')}
      </button>
      {open && <DeleteModal onClose={() => setOpen(false)} />}
    </SectionCard>
  )
}
