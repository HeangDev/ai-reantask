import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { CheckIcon, ChevronDownIcon } from '@/components/ui/icons'

export interface DropdownOption {
  value: string
  label: string
}

interface Props {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  /** Shown when `value` matches no option (for example an empty value). */
  placeholder?: string
  id?: string
  invalid?: boolean
  /** Sizing/layout for the outer box (width, margin). */
  wrapperClassName?: string
  /** Extra classes for the trigger button, such as a smaller text size. */
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

interface Position {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
}

const GAP = 4
// The list shows this many options before it scrolls; with fewer there is no scrollbar.
const MAX_VISIBLE_OPTIONS = 5
const OPTION_HEIGHT = 32 // py-1.5 + one text-sm line
const LIST_PADDING = 10 // p-1 plus the border
const MAX_LIST_HEIGHT = MAX_VISIBLE_OPTIONS * OPTION_HEIGHT + LIST_PADDING
// Wide enough for an option plus its tick even when the trigger is narrow.
const MIN_LIST_WIDTH = 96

/**
 * Select replacement with a styled list. The browser draws a native <select>'s open list itself,
 * so it cannot be styled; this keeps the same keyboard behaviour (arrows, Home/End, Enter, Escape).
 */
export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = '',
  id,
  invalid = false,
  wrapperClassName = '',
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState<Position | null>(null)

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  const openList = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    // Fixed positioning lets the list escape clipping parents such as dialogs and scroll areas.
    const below = window.innerHeight - rect.bottom - GAP - 8
    const above = rect.top - GAP - 8
    const flip = below < 160 && above > below
    setPosition({
      left: rect.left,
      width: rect.width,
      ...(flip ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
      maxHeight: Math.min(MAX_LIST_HEIGHT, flip ? above : below),
    })
    setActive(Math.max(selectedIndex, 0))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const choose = (index: number) => {
    onChange(options[index].value)
    close()
    buttonRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    // The list is fixed to the viewport, so any scroll or resize would leave it detached.
    const onMove = (e: Event) => {
      if (!(e.target instanceof Node && document.getElementById(listId)?.contains(e.target))) close()
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', onMove, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open, listId])

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, listId])

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        // Keep Escape from also closing a dialog that contains the dropdown.
        e.preventDefault()
        e.stopPropagation()
        close()
        break
      case 'Tab':
        close()
        break
    }
  }

  return (
    <span ref={rootRef} className={`relative inline-block ${wrapperClassName}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-surface py-1.5 pl-3 pr-2.5 text-left text-sm transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-accent ${
          invalid ? 'border-red-500' : open ? 'border-accent' : 'border-line'
        } ${className}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-fg' : 'text-muted'}`}>
          {selected?.label ?? placeholder}
        </span>
        <span
          className={`shrink-0 text-muted transition-transform [&>svg]:h-4 [&>svg]:w-4 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <ChevronDownIcon />
        </span>
      </button>

      {open && position && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          // Keep focus on the trigger: clicking an option must not blur it.
          onMouseDown={(e) => e.preventDefault()}
          // The dropdown may sit inside a <label>, whose default action is to click its control.
          // Cancelling it keeps the list closed after an option is chosen.
          onClick={(e) => e.preventDefault()}
          style={{ ...position, width: undefined, minWidth: Math.max(position.width, MIN_LIST_WIDTH) }}
          className="fixed z-50 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-lg shadow-black/10 dark:shadow-black/40"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(i)}
                onMouseMove={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm ${
                  i === active ? 'bg-hover' : ''
                } ${isSelected ? 'font-medium text-accent-fg' : 'text-fg'}`}
              >
                <span className="truncate">{o.label}</span>
                {isSelected && (
                  <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                    <CheckIcon />
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </span>
  )
}
