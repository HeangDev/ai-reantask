import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { CloseIcon } from '@/components/ui/icons'
import { useI18n } from '@/lib/i18n'

interface Props {
  title: string
  onClose: () => void
  /** `lg` is wide and scrolls inside the dialog, for content such as a full assignment. */
  size?: 'md' | 'lg' | 'xl'
  /** Scroll the whole content. Turn off when the content scrolls only part of itself, such as a form with a pinned footer. */
  scroll?: boolean
  children: ReactNode
}

const widths = { md: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-6xl' }

/** Native <dialog> shell: focus trap, Escape and backdrop come from the browser. */
export default function Modal({ title, onClose, size = 'md', scroll = true, children }: Props) {
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
      aria-labelledby="student-modal-title"
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${widths[size]} overflow-hidden rounded-xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40 open:flex open:flex-col`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
        <h2 id="student-modal-title" className="text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('dialog.close')}
          className="rounded-md p-1 text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
        >
          <CloseIcon />
        </button>
      </div>
      <div className={`flex min-h-0 flex-1 flex-col ${scroll ? 'overflow-y-auto' : ''}`}>{children}</div>
    </dialog>
  )
}
