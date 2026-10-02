import { useCallback, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDownIcon } from '@/components/ui/icons'
import { useDismissable } from '@/hooks/useDismissable'

export interface ExportOption {
  label: string
  icon: ReactNode
  onSelect: () => void
}

interface Props {
  label: string
  options: ExportOption[]
  disabled?: boolean
}

/** A button that opens a short list of ways to export what is on screen. */
export default function ExportMenu({ label, options, disabled = false }: Props) {
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useDismissable(open, close, rootRef, buttonRef)

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="flex items-center gap-1.5 rounded-lg bg-accent-strong px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:h-3.5 [&>svg]:w-3.5"
      >
        {label}
        <ChevronDownIcon />
      </button>

      {open && (
        <ul
          id={panelId}
          className="absolute right-0 top-full z-40 mt-1.5 w-44 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lg"
        >
          {options.map((option) => (
            <li key={option.label}>
              <button
                type="button"
                onClick={() => {
                  close()
                  option.onSelect()
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
              >
                {option.icon}
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
