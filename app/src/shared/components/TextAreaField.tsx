import { useId } from 'react'
import { RequiredMark } from '@/shared/components/RequiredMark'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  error?: TranslationKey
  /** Shows a "length/max" counter. */
  maxLength: number
  rows?: number
  /** Marks the field as required with a red asterisk. */
  required?: boolean
}

/** Labelled multi-line input with a character counter and a field-level error. */
export function TextAreaField({ label, value, onChange, error, maxLength, rows = 3, required = false }: Props) {
  const { t } = useI18n()
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <RequiredMark />}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-required={required || undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-help`}
        className={`mt-1 w-full resize-none rounded-lg border bg-sunken px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent ${
          error ? 'border-red-500' : 'border-line'
        }`}
      />
      <p
        id={`${id}-help`}
        className={`mt-1 flex justify-between gap-2 text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}
      >
        <span>{error ? t(error) : ''}</span>
        <span>
          {value.trim().length}/{maxLength}
        </span>
      </p>
    </div>
  )
}
