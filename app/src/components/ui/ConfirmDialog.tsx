import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'

interface Props {
  open: boolean
  icon: ReactNode
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** Optional extra context shown between the message and the buttons. */
  children?: ReactNode
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export default function ConfirmDialog({ open, icon, title, message, confirmLabel, onConfirm, onCancel, children }: Props) {
  const { t } = useI18n()
  const ref = useRef<HTMLDialogElement>(null)

  // The native <dialog> provides focus trapping, Escape to close and the backdrop.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      className="confirm-dialog m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40"
    >
      <div className="flex gap-4 p-5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-sunken text-fg [&>svg]:h-5 [&>svg]:w-5"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="confirm-title" className="text-base font-semibold leading-10 sm:leading-normal">{title}</h2>
          <p id="confirm-message" className="mt-1 text-sm text-muted">{message}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line bg-sunken px-5 py-3">
        <button
          type="button"
          onClick={onCancel}
          autoFocus
          className={`rounded-lg border border-line bg-surface px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-hover ${focusRing}`}
        >
          {t('dialog.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm shadow-red-600/30 transition-colors hover:bg-red-700 ${focusRing}`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
