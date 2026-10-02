import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  value: string
  onChange: (value: string) => void
  error?: TranslationKey
  hint?: string
  /** A control placed inside the right edge of the input, such as a show/hide button. */
  trailing?: ReactNode
}

/** Labelled input with a field-level error, wired up for screen readers. */
export default function TextField({ label, value, onChange, error, hint, trailing, disabled, ...input }: Props) {
  const { t } = useI18n()
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          {...input}
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-lg border bg-sunken px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${trailing ? 'pr-10' : ''} ${
            error ? 'border-red-500' : 'border-line'
          }`}
        />
        {trailing && <span className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</span>}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {t(error)}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
