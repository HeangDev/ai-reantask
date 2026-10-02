import type { KeyboardEvent } from 'react'
import { MinusIcon, PlusIcon } from '@/components/ui/icons'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** The number as typed; kept as a string so an empty or half-typed field is representable. */
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  /** A short unit shown after the number, such as "MB". */
  suffix?: string
  id?: string
  invalid?: boolean
  disabled?: boolean
  /** Sizing/layout for the outer box (width, margin). */
  wrapperClassName?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

const stepButton =
  'flex w-10 shrink-0 items-center justify-center text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent [&>svg]:h-4 [&>svg]:w-4'

/**
 * Whole-number field with − / + buttons. A native number input shows tiny browser spinners and accepts
 * "e", "-" and ".", so this keeps a text field limited to digits and clamps the buttons and arrow keys
 * to `min` and `max`.
 */
export default function NumberInput({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  suffix,
  id,
  invalid = false,
  disabled = false,
  wrapperClassName = '',
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
}: Props) {
  const { t } = useI18n()
  const current = value === '' ? null : Number(value)

  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const stepBy = (direction: 1 | -1) => {
    // From an empty field the first press starts at `min`.
    onChange(String(current === null ? min : clamp(current + direction * step)))
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      stepBy(e.key === 'ArrowUp' ? 1 : -1)
    }
  }

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-lg border bg-sunken text-sm transition-colors focus-within:outline-2 focus-within:outline-accent ${
        invalid ? 'border-red-500' : 'border-line hover:border-accent/50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${wrapperClassName}`}
    >
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled || (current !== null && current <= min)}
        aria-label={t('num.decrease')}
        onClick={() => stepBy(-1)}
        className={`${stepButton} border-r border-line`}
      >
        <MinusIcon />
      </button>
      <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={value}
          size={1}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          aria-valuemin={min}
          aria-valuemax={max === Number.MAX_SAFE_INTEGER ? undefined : max}
          aria-valuenow={current ?? undefined}
          role="spinbutton"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent py-2 text-center font-medium tabular-nums text-fg outline-none"
        />
        {suffix && <span className="shrink-0 text-xs text-muted">{suffix}</span>}
      </span>
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled || (current !== null && current >= max)}
        aria-label={t('num.increase')}
        onClick={() => stepBy(1)}
        className={`${stepButton} border-l border-line`}
      >
        <PlusIcon />
      </button>
    </div>
  )
}
