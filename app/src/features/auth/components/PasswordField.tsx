import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons'
import TextField from '@/components/ui/TextField'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  error?: TranslationKey
  hint?: string
  autoComplete: 'current-password' | 'new-password'
}

/** A password input with a button that shows or hides what was typed. */
export default function PasswordField({ label, value, onChange, error, hint, autoComplete }: Props) {
  const { t } = useI18n()
  const [shown, setShown] = useState(false)

  return (
    <TextField
      label={label}
      type={shown ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      error={error}
      hint={hint}
      trailing={
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={t(shown ? 'login.hidePassword' : 'login.showPassword')}
          aria-pressed={shown}
          className="rounded p-1 text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
        >
          {shown ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  )
}
