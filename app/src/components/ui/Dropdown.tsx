import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { CheckIcon, ChevronDownIcon, SearchIcon } from '@/components/ui/icons'
import { useI18n } from '@/lib/i18n'

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
const SEARCH_HEIGHT = 45 // the search box plus its divider, shown when there are more options than fit
// Wide enough for an option plus its tick even when the trigger is narrow.
const MIN_LIST_WIDTH = 96

/**
 * Select replacement with a styled list. The browser draws a native <select>'s open list itself,
 * so it cannot be styled; this keeps the same keyboard behaviour (arrows, Home/End, Enter, Escape).
 * With more options than fit without scrolling, a search box at the top of the list filters them.
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
  const { t } = useI18n()
  const listId = useId()
  const rootRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState<Position | null>(null)

  const searchable = options.length > MAX_VISIBLE_OPTIONS
  const needle = query.trim().toLowerCase()
  const visible = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options

  const selected = options.find((o) => o.value === value) ?? null

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
      maxHeight: Math.min(MAX_LIST_HEIGHT + (searchable ? SEARCH_HEIGHT : 0), flip ? above : below),
    })
    setQuery('')
    setActive(Math.max(options.findIndex((o) => o.value === value), 0))
    setOpen(true)
  }

  const close = () => setOpen(false)

  const choose = (index: number) => {
    if (!visible[index]) return
    onChange(visible[index].value)
    close()
    buttonRef.current?.focus()
  }

  // The search box takes focus so typing filters straight away.
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus()
  }, [open, searchable])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    // The list is fixed to the viewport, so any scroll or resize would leave it detached.
    const onMove = (e: Event) => {
      if (!(e.target instanceof Node && popupRef.current?.contains(e.target))) close()
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', onMove, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open])

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, listId])

  const onKeyDown = (e: KeyboardEvent) => {
    const inSearch = e.target === searchRef.current
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
        setActive((i) => Math.min(i + 1, visible.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
        break
      case 'Home':
      case 'End':
        // In the search box these move the text cursor.
        if (inSearch) break
        e.preventDefault()
        setActive(e.key === 'Home' ? 0 : visible.length - 1)
        break
      case 'Enter':
      case ' ':
        // A space in the search box is part of the query.
        if (inSearch && e.key === ' ') break
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        // Keep Escape from also closing a dialog that contains the dropdown.
        e.preventDefault()
        e.stopPropagation()
        close()
        buttonRef.current?.focus()
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
        <div
          ref={popupRef}
          // The dropdown may sit inside a <label>, whose default action is to click its control.
          // Cancelling it keeps the list closed after an option is chosen.
          onClick={(e) => e.preventDefault()}
          style={{ ...position, width: undefined, minWidth: Math.max(position.width, MIN_LIST_WIDTH) }}
          className="fixed z-50 flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg shadow-black/10 dark:shadow-black/40"
        >
          {searchable && (
            <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2.5">
              <span className="shrink-0 text-muted [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                ref={searchRef}
                type="text"
                role="searchbox"
                autoComplete="off"
                value={query}
                placeholder={t('dd.search')}
                aria-label={t('dd.search')}
                aria-controls={listId}
                aria-activedescendant={visible.length > 0 ? `${listId}-${active}` : undefined}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onKeyDown}
                className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
              />
            </div>
          )}
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            // Keep focus where it is: clicking an option must not blur the trigger or the search box.
            onMouseDown={(e) => e.preventDefault()}
            className="min-h-0 overflow-y-auto p-1"
          >
            {visible.map((o, i) => {
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
            {visible.length === 0 && (
              <li role="presentation" className="px-2.5 py-3 text-center text-sm text-muted">
                {t('dd.noResults')}
              </li>
            )}
          </ul>
        </div>
      )}
    </span>
  )
}
