import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import TextField from '@/components/ui/TextField'
import { useToast } from '@/components/ui/Toast'
import { useProfile } from '@/features/account/store/accountStore'
import { CLASS_CODE_LENGTH, normalizeClassCode } from '@/features/classes/lib/classCode'
import { checkJoinCode } from '@/features/classes/lib/joinClass'
import { useClasses } from '@/features/classes/store/classesStore'
import { joinedClassIds, joinRequestsActions, pendingClassIds, useJoinRequests } from '@/features/classes/store/joinRequestsStore'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

/** A student enters a class code; the teacher still has to approve before they are in the class. */
export default function JoinClassDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { notify, notifyRole } = useToast()
  const profile = useProfile()
  const classes = useClasses()
  const requests = useJoinRequests()
  const [code, setCode] = useState('')
  const [error, setError] = useState<TranslationKey>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const result = checkJoinCode(code, classes, joinedClassIds(requests), pendingClassIds(requests))
    if (!result.ok) {
      setError(result.error)
      return
    }

    const name = result.schoolClass.name
    joinRequestsActions.request(result.schoolClass.id, profile.fullName)
    // The student is told the request is waiting; the teacher is told someone needs approving.
    notify({ variant: 'info', title: t('join.requested'), subtitle: t('join.requestedDesc', { name }) })
    notifyRole('teacher', {
      variant: 'info',
      title: t('join.reqTitle'),
      subtitle: t('join.reqDesc', { student: profile.fullName, name }),
      to: '/classes',
    })
    onClose()
  }

  return (
    <Modal title={t('join.title')} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        <p className="text-sm text-muted">{t('join.desc')}</p>
        <TextField
          label={t('join.codeLabel')}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={CLASS_CODE_LENGTH}
          placeholder="ABC123"
          value={code}
          onChange={(v) => {
            setCode(normalizeClassCode(v))
            setError(undefined)
          }}
          error={error}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('dialog.cancel')}
          </button>
          <Button type="submit">{t('join.submit')}</Button>
        </div>
      </form>
    </Modal>
  )
}
