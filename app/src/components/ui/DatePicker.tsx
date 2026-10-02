import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'
import { formatDate, todayIso } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** The chosen day as `YYYY-MM-DD`, or an empty string. */
  value: string
  onChange: (value: string) => void
  /** Earliest / latest selectable day (`YYYY-MM-DD`). */
  min?: string
  max?: string
  /** Shown while no day is chosen. */
  placeholder?: string
  id?: string
  invalid?: boolean
  /** Sizing/layout for the outer box (width, margin). */
  wrapperClassName?: string
  /** Extra classes for the trigger button. */
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

type Mode = 'days' | 'months' | 'years'

const POPOVER_WIDTH = 288
const POPOVER_HEIGHT = 372
const GAP = 4
const MARGIN = 8
const YEARS_PER_PAGE = 12

const pad = (n: number) => String(n).padStart(2, '0')
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m: m - 1, d }
}
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

const addDays = (iso: string, n: number) => {
  const { y, m, d } = fromIso(iso)
  const next = new Date(y, m, d + n)
  return toIso(next.getFullYear(), next.getMonth(), next.getDate())
}
const addMonths = (iso: string, n: number) => {
  const { y, m, d } = fromIso(iso)
  const first = new Date(y, m + n, 1)
  return toIso(first.getFullYear(), first.getMonth(), Math.min(d, daysIn(first.getFullYear(), first.getMonth())))
}

interface Position {
  left: number
  top?: number
  bottom?: number
}

const navButton =
  'flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent [&>svg]:h-4 [&>svg]:w-4'

/**
 * Date field with a styled calendar. The browser draws a native date input's popup itself, so it cannot
 * be styled; this keeps keyboard support (arrows, Home/End, PageUp/PageDown, Enter, Escape) and adds a
 * month and year picker so a date of birth is a few clicks away instead of a long scroll.
 */
export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder,
  id,
  invalid = false,
  wrapperClassName = '',
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
}: Props) {
  const { t, locale } = useI18n()
  const popoverId = useId()
  const rootRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef(false)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [mode, setMode] = useState<Mode>('days')
  const [focused, setFocused] = useState(todayIso)
  // The month on show; kept apart from `focused` so paging through months does not move the keyboard cursor.
  const [shown, setShown] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }))

  const today = todayIso()
  const inRange = (iso: string) => !(min && iso < min) && !(max && iso > max)
  const clamp = (iso: string) => (min && iso < min ? min : max && iso > max ? max : iso)

  const openPopover = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const below = window.innerHeight - rect.bottom - GAP - MARGIN
    const above = rect.top - GAP - MARGIN
    const flip = below < POPOVER_HEIGHT && above > below
    setPosition({
      left: Math.max(MARGIN, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - MARGIN)),
      ...(flip ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
    })
    const start = clamp(value || today)
    const { y, m } = fromIso(start)
    setFocused(start)
    setShown({ year: y, month: m })
    setMode('days')
    pendingFocus.current = true
    setOpen(true)
  }

  const close = () => setOpen(false)

  const choose = (iso: string) => {
    onChange(iso)
    close()
    buttonRef.current?.focus()
  }

  const goTo = (iso: string) => {
    const { y, m } = fromIso(iso)
    setFocused(iso)
    setShown({ year: y, month: m })
    pendingFocus.current = true
  }

  // Move real focus onto the keyboard cursor, but only after the user opened the popover or used the keyboard.
  useEffect(() => {
    if (!open || mode !== 'days' || !pendingFocus.current) return
    pendingFocus.current = false
    popoverRef.current?.querySelector<HTMLElement>(`[data-iso="${focused}"]`)?.focus()
  }, [open, mode, focused, shown])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    // The popover is fixed to the viewport, so any scroll or resize would leave it detached.
    const onMove = (e: Event) => {
      if (!(e.target instanceof Node && popoverRef.current?.contains(e.target))) close()
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

  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (!open && e.key === 'ArrowDown') {
      e.preventDefault()
      openPopover()
    }
  }

  const onPopoverKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Keep Escape from also closing a dialog that contains the picker.
      e.preventDefault()
      e.stopPropagation()
      close()
      buttonRef.current?.focus()
      return
    }
    if (mode !== 'days' || !(e.target as HTMLElement).dataset.iso) return
    const weekday = new Date(fromIso(focused).y, fromIso(focused).m, fromIso(focused).d).getDay()
    const moves: Record<string, string> = {
      ArrowLeft: addDays(focused, -1),
      ArrowRight: addDays(focused, 1),
      ArrowUp: addDays(focused, -7),
      ArrowDown: addDays(focused, 7),
      Home: addDays(focused, -weekday),
      End: addDays(focused, 6 - weekday),
      PageUp: addMonths(focused, e.shiftKey ? -12 : -1),
      PageDown: addMonths(focused, e.shiftKey ? 12 : 1),
    }
    const next = moves[e.key]
    if (!next) return
    e.preventDefault()
    goTo(clamp(next))
  }

  const stepMonth = (n: number) => {
    const next = new Date(shown.year, shown.month + n, 1)
    setShown({ year: next.getFullYear(), month: next.getMonth() })
  }

  // --- Day grid -----------------------------------------------------------------------------
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayFormat.format(new Date(2023, 0, 1 + i))) // 2023-01-01 is a Sunday
  const gridStart = new Date(shown.year, shown.month, 1 - new Date(shown.year, shown.month, 1).getDay())
  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    return { iso: toIso(date.getFullYear(), date.getMonth(), date.getDate()), date, inMonth: date.getMonth() === shown.month }
  })
  // The tab stop must exist in the visible month, otherwise the grid would be unreachable by keyboard.
  const tabStop = cells.some((c) => c.iso === focused && c.inMonth)
    ? focused
    : toIso(shown.year, shown.month, Math.min(fromIso(focused).d, daysIn(shown.year, shown.month)))

  // --- Month / year views -------------------------------------------------------------------
  const monthFormat = new Intl.DateTimeFormat(locale, { month: 'short' })
  const monthDisabled = (month: number) =>
    Boolean((max && toIso(shown.year, month, 1) > max) || (min && toIso(shown.year, month, daysIn(shown.year, month)) < min))
  const yearDisabled = (year: number) => Boolean((max && toIso(year, 0, 1) > max) || (min && toIso(year, 11, 31) < min))
  const pageStart = shown.year - (((shown.year % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE)

  const title =
    mode === 'days'
      ? new Date(shown.year, shown.month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
      : mode === 'months'
        ? String(shown.year)
        : `${pageStart} – ${pageStart + YEARS_PER_PAGE - 1}`

  const prev = () =>
    mode === 'days' ? stepMonth(-1) : setShown((s) => ({ ...s, year: s.year - (mode === 'months' ? 1 : YEARS_PER_PAGE) }))
  const next = () =>
    mode === 'days' ? stepMonth(1) : setShown((s) => ({ ...s, year: s.year + (mode === 'months' ? 1 : YEARS_PER_PAGE) }))

  const cellBase =
    'flex items-center justify-center rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-30'
  const pickClass = (selected: boolean, current: boolean) =>
    `${cellBase} h-11 ${
      selected
        ? 'bg-accent-strong font-semibold text-white'
        : `${current ? 'text-accent-fg ring-1 ring-accent/50' : 'text-fg'} hover:bg-hover disabled:hover:bg-transparent`
    }`

  const selectedParts = value ? fromIso(value) : null

  return (
    <span ref={rootRef} className={`relative inline-block ${wrapperClassName}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? close() : openPopover())}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full items-center gap-2 rounded-lg border bg-sunken py-2 pl-3 pr-2.5 text-left text-sm transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-accent ${
          invalid ? 'border-red-500' : open ? 'border-accent' : 'border-line'
        } ${className}`}
      >
        <span className="shrink-0 text-muted [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
          <CalendarIcon />
        </span>
        <span className={`min-w-0 flex-1 truncate ${value ? 'text-fg' : 'text-muted'}`}>
          {value ? formatDate(value, locale) : (placeholder ?? t('date.choose'))}
        </span>
      </button>

      {open && position && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label={t('date.choose')}
          onKeyDown={onPopoverKeyDown}
          // Keep a click on the popover's empty space from blurring the focused day.
          onMouseDown={(e) => {
            if (!(e.target as HTMLElement).closest('button')) e.preventDefault()
          }}
          // The picker may sit inside a <label>, whose default action is to click its control.
          onClick={(e) => e.preventDefault()}
          style={{ ...position, width: POPOVER_WIDTH }}
          className="fixed z-50 rounded-xl border border-line bg-surface p-3 shadow-lg shadow-black/10 dark:shadow-black/40"
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setMode(mode === 'days' ? 'months' : mode === 'months' ? 'years' : 'days')}
              aria-live="polite"
              className="flex min-w-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span className="truncate">{title}</span>
              <span
                className={`shrink-0 text-muted transition-transform [&>svg]:h-4 [&>svg]:w-4 ${mode === 'days' ? '' : 'rotate-180'}`}
                aria-hidden="true"
              >
                <ChevronDownIcon />
              </span>
            </button>
            <div className="flex shrink-0 items-center">
              <button type="button" onClick={prev} aria-label={t('date.prev')} className={navButton}>
                <ChevronLeftIcon />
              </button>
              <button type="button" onClick={next} aria-label={t('date.next')} className={navButton}>
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className="h-[244px]">
            {mode === 'days' && (
              <div role="grid" aria-label={title}>
                <div className="grid grid-cols-7 text-center text-xs font-medium text-muted" aria-hidden="true">
                  {weekdays.map((w, i) => (
                    <span key={i} className="flex h-7 items-center justify-center">
                      {w}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {cells.map(({ iso, date, inMonth }) => {
                    const selected = iso === value
                    const isToday = iso === today
                    return (
                      <button
                        key={iso}
                        type="button"
                        data-iso={iso}
                        disabled={!inRange(iso)}
                        tabIndex={iso === tabStop ? 0 : -1}
                        aria-pressed={selected}
                        aria-current={isToday ? 'date' : undefined}
                        aria-label={date.toLocaleDateString(locale, { dateStyle: 'full' })}
                        onClick={() => choose(iso)}
                        onFocus={() => setFocused(iso)}
                        className={`${cellBase} h-9 ${
                          selected
                            ? 'bg-accent-strong font-semibold text-white'
                            : `${isToday ? 'font-semibold text-accent-fg ring-1 ring-accent/50' : inMonth ? 'text-fg' : 'text-muted/60'} hover:bg-hover disabled:hover:bg-transparent`
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {mode === 'months' && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {Array.from({ length: 12 }, (_, m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={monthDisabled(m)}
                    aria-pressed={selectedParts?.y === shown.year && selectedParts.m === m}
                    onClick={() => {
                      setShown((s) => ({ ...s, month: m }))
                      setFocused(clamp(toIso(shown.year, m, Math.min(fromIso(focused).d, daysIn(shown.year, m)))))
                      setMode('days')
                    }}
                    className={pickClass(
                      selectedParts?.y === shown.year && selectedParts.m === m,
                      new Date().getFullYear() === shown.year && new Date().getMonth() === m,
                    )}
                  >
                    {monthFormat.format(new Date(2000, m, 1))}
                  </button>
                ))}
              </div>
            )}

            {mode === 'years' && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i).map((year) => (
                  <button
                    key={year}
                    type="button"
                    disabled={yearDisabled(year)}
                    aria-pressed={selectedParts?.y === year}
                    onClick={() => {
                      setShown((s) => ({ ...s, year }))
                      setMode('months')
                    }}
                    className={pickClass(selectedParts?.y === year, new Date().getFullYear() === year)}
                  >
                    {new Date(year, 0, 1).toLocaleDateString(locale, { year: 'numeric' })}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <button
              type="button"
              disabled={!inRange(today)}
              onClick={() => choose(today)}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {t('date.today')}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => choose('')}
                className="rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
              >
                {t('date.clear')}
              </button>
            )}
          </div>
        </div>
      )}
    </span>
  )
}
