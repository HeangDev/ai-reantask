import { useId, useState } from 'react'
import type { SubmitEvent, KeyboardEvent } from 'react'
import { Button } from '@/shared/components/Button'
import { CloseIcon, MailIcon } from '@/shared/components/icons'
import { Modal } from '@/shared/components/Modal'
import { useToast } from '@/shared/components/Toast'
import { RegistrationBadge } from '@/features/classes/components/RegistrationBadge'
import { useEmailRegistration } from '@/features/classes/hooks/useEmailRegistration'
import { parseEmails } from '@/features/classes/lib/inviteEmails'
import { invitationsActions, invitationsOfClass, useInvitations } from '@/features/classes/store/invitationsStore'
import type { SchoolClass } from '@/features/classes/types'
import { formatTimeAgo } from '@/shared/lib/timeAgo'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

interface Props {
  schoolClass: SchoolClass
  onClose: () => void
}

interface EntryError {
  key: TranslationKey
  email: string
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const smallButton = `rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-fg ${focusRing}`

/** The teacher invites students to a class by email: type or paste addresses, review them as chips, then send. */
export function InviteStudentsDialog({ schoolClass, onClose }: Props) {
  const { t, locale } = useI18n()
  const { notify } = useToast()
  const inputId = useId()
  const messageId = `${inputId}-message`
  const invitations = invitationsOfClass(useInvitations(), schoolClass.id)
  const [chips, setChips] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<EntryError | null>(null)

  const registration = useEmailRegistration(chips)
  const checking = chips.some((email) => registration[email] === undefined)
  const count = (status: string) => chips.filter((email) => registration[email] === status).length

  const taken = () => new Set([...chips, ...invitations.map((i) => i.email)])

  /** Moves the typed text into chips. Whatever cannot be used stays in the input with an error. Returns the chips afterwards. */
  const commitDraft = (): string[] => {
    const { valid, invalid, duplicates } = parseEmails(draft, taken())
    const next = [...chips, ...valid]
    setChips(next)
    setDraft(invalid.join(', '))
    if (invalid.length > 0) setError({ key: 'cls.inviteErrInvalid', email: invalid[0] ?? '' })
    else if (duplicates.length > 0) setError({ key: 'cls.inviteErrDup', email: duplicates[0] ?? '' })
    else setError(null)
    return invalid.length > 0 ? chips : next
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault()
      if (draft.trim()) commitDraft()
    } else if (e.key === 'Backspace' && !draft && chips.length > 0) {
      setChips(chips.slice(0, -1))
    }
  }

  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    const toSend = draft.trim() ? commitDraft() : chips
    // Text that is not an email is still in the input, so nothing is sent until the teacher fixes or clears it.
    // Wait for the registration check, so each invitation records the right status.
    if (toSend.length === 0 || checking || parseEmails(draft).invalid.length > 0) return
    invitationsActions.invite(
      schoolClass.id,
      toSend.map((email) => ({ email, registration: registration[email] ?? 'unregistered' })),
    )
    notify({
      title: t('cls.inviteSentTitle'),
      subtitle: t('cls.inviteSentDesc', { count: String(toSend.length), name: schoolClass.name }),
    })
    setChips([])
    setDraft('')
    setError(null)
  }

  return (
    <Modal title={t('cls.inviteTitle', { name: schoolClass.name })} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-5 p-5">
        <p className="text-sm text-muted">{t('cls.inviteIntro')}</p>

        <div>
          <label htmlFor={inputId} className="text-sm font-medium">
            {t('cls.inviteEmails')}
          </label>
          <div
            className={`mt-1 flex flex-wrap items-center gap-1.5 rounded-lg border bg-sunken p-2 focus-within:outline-2 focus-within:outline-accent ${
              error ? 'border-red-500' : 'border-line'
            }`}
          >
            {chips.map((email) => (
              <span key={email} className="flex items-center gap-1 rounded-full bg-surface py-0.5 pl-2.5 pr-1 text-xs font-medium ring-1 ring-line">
                {email}
                <RegistrationBadge status={registration[email]} />
                <button
                  type="button"
                  onClick={() => setChips(chips.filter((c) => c !== email))}
                  aria-label={t('cls.inviteRemove', { email })}
                  className={`rounded-full p-0.5 text-muted hover:bg-hover hover:text-fg ${focusRing} [&>svg]:h-3.5 [&>svg]:w-3.5`}
                >
                  <CloseIcon />
                </button>
              </span>
            ))}
            <input
              id={inputId}
              type="email"
              inputMode="email"
              autoComplete="off"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setError(null)
              }}
              onKeyDown={onKeyDown}
              onBlur={() => draft.trim() && commitDraft()}
              placeholder={chips.length === 0 ? t('cls.invitePh') : ''}
              aria-invalid={error ? true : undefined}
              aria-describedby={messageId}
              className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm outline-none"
            />
          </div>
          <p id={messageId} role={error ? 'alert' : undefined} className={`mt-1 text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}>
            {error ? t(error.key, { email: error.email }) : t('cls.inviteHint')}
          </p>
        </div>

        {chips.length > 0 && (
          <div aria-live="polite" className="space-y-1 rounded-lg bg-sunken p-3 text-xs">
            {checking ? (
              <p className="text-muted">{t('cls.regChecking')}</p>
            ) : (
              <>
                <p className="font-medium">
                  {t('cls.regSummary', {
                    registered: String(count('registered')),
                    pending: String(count('pending')),
                    unregistered: String(count('unregistered')),
                  })}
                </p>
                {count('unregistered') > 0 && <p className="text-muted">{t('cls.regUnregisteredNote')}</p>}
                {count('pending') > 0 && <p className="text-muted">{t('cls.regPendingNote')}</p>}
              </>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={(chips.length === 0 && !draft.trim()) || checking} className="flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4">
            <MailIcon />
            {chips.length > 0 ? t('cls.inviteSendCount', { count: String(chips.length) }) : t('cls.inviteSend')}
          </Button>
        </div>

        <section aria-labelledby={`${inputId}-list`} className="border-t border-line pt-4">
          <h3 id={`${inputId}-list`} className="text-sm font-medium">
            {t('cls.invited')} <span className="text-muted">({invitations.length})</span>
          </h3>
          {invitations.length === 0 ? (
            <p className="mt-1 text-sm text-muted">{t('cls.inviteNone')}</p>
          ) : (
            <ul className="mt-2 max-h-56 divide-y divide-line overflow-y-auto rounded-lg border border-line">
              {invitations.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{i.email}</span>
                      <RegistrationBadge status={i.registration} />
                    </p>
                    <p className="text-xs text-muted">{t('cls.inviteSent', { time: formatTimeAgo(i.sentAt, locale) })}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className={smallButton}
                      aria-label={t('cls.inviteResendAria', { email: i.email })}
                      onClick={() => {
                        invitationsActions.resend(i.id)
                        notify({ variant: 'info', title: t('cls.inviteResent'), subtitle: i.email })
                      }}
                    >
                      {t('cls.inviteResend')}
                    </button>
                    <button
                      type="button"
                      className={`${smallButton} hover:text-red-600 dark:hover:text-red-400`}
                      aria-label={t('cls.inviteRevokeAria', { email: i.email })}
                      onClick={() => {
                        invitationsActions.revoke(i.id)
                        notify({ variant: 'danger', title: t('cls.inviteRevoked'), subtitle: i.email })
                      }}
                    >
                      {t('cls.inviteRevoke')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg ${focusRing}`}
          >
            {t('dialog.close')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
