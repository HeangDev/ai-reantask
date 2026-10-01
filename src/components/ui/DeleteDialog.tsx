import { useEffect, useRef } from 'react'
import Avatar from '@/components/ui/Avatar'
import { TrashIcon } from '@/components/ui/icons'
import { useI18n } from '@/lib/i18n'

interface Props {
  title: string
  message: string
  confirmLabel: string
  /** Shown in a preview card when deleting a single person. */
  person?: { fullName: string; email: string }
  onConfirm: () => void
  onCancel: () => void
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2'

/** Centered delete confirmation: warning icon, who is affected, then two equal buttons. */
export default function DeleteDialog({ title, message, confirmLabel, person, onConfirm, onCancel }: Props) {
  const { t } = useI18n()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
      aria-labelledby="delete-title"
      aria-describedby="delete-message"
      className="confirm-dialog m-auto w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40"
    >
      <div className="flex flex-col items-center px-6 pb-5 pt-7 text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 ring-8 ring-red-50 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/5 [&>svg]:h-6 [&>svg]:w-6"
          aria-hidden="true"
        >
          <TrashIcon />
        </span>
        <h2 id="delete-title" className="mt-5 text-lg font-semibold">{title}</h2>
        <p id="delete-message" className="mt-1.5 text-sm text-muted">{message}</p>

        {person && (
          <div className="mt-5 flex w-full items-center gap-3 rounded-xl border border-line bg-sunken p-3 text-left">
            <Avatar name={person.fullName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{person.fullName}</p>
              <p className="truncate text-xs text-muted">{person.email}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 pb-6">
        <button
          type="button"
          onClick={onCancel}
          autoFocus
          className={`rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-hover ${focusRing} focus-visible:outline-accent`}
        >
          {t('dialog.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-red-600/30 transition-colors hover:bg-red-700 ${focusRing} focus-visible:outline-red-600`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
