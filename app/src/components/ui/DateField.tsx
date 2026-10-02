import { useId } from 'react'
import DatePicker from '@/components/ui/DatePicker'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  error?: TranslationKey
}

/** Labelled date picker with a field-level error, the counterpart of TextField for dates. */
export default function DateField({ label, value, onChange, min, max, error }: Props) {
  const { t } = useI18n()
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <DatePicker
        id={id}
        wrapperClassName="mt-1 block w-full"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {t(error)}
        </p>
      )}
    </div>
  )
}
