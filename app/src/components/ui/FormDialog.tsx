import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { CloseIcon } from '@/components/ui/icons'
import { useI18n } from '@/lib/i18n'

interface Props {
  title: string
  description: string
  /** Live preview shown beside the form. */
  preview: ReactNode
  onClose: () => void
  children: ReactNode
}

/** Centered two-pane dialog: title and live preview on the left, the form on the right. */
export default function FormDialog({ title, description, preview, onClose, children }: Props) {
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
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="form-dialog-title"
      className="confirm-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40 open:flex open:flex-col md:open:grid md:open:grid-cols-[17rem_1fr]"
    >
      <aside className="border-b border-line bg-accent-soft p-6 md:border-b-0 md:border-r">
        <h2 id="form-dialog-title" className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
        <div className="mt-5 hidden md:block">{preview}</div>
      </aside>

      <div className="relative flex min-h-0 flex-col">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('dialog.close')}
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
        >
          <CloseIcon />
        </button>
        {children}
      </div>
    </dialog>
  )
}
