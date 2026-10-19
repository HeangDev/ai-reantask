import { useEffect, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Button } from '@/shared/components/Button'
import { ArrowLeftIcon, RolesIcon } from '@/shared/components/icons'
import { TextField } from '@/shared/components/TextField'
import { isValidCode } from '@/features/auth/lib/validation'
import { verifyTotp } from '@/features/auth/lib/totp'
import { getTwoFactorSecret } from '@/shared/store/twoFactorStore'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

interface Props {
  onVerified: () => void
  onBack: () => void
}

/** The second step of signing in, shown after the password when two-factor authentication is on. */
export function TwoFactorStep({ onVerified, onBack }: Props) {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [error, setError] = useState<TranslationKey>()
  const [checking, setChecking] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    codeRef.current?.focus()
  }, [])

  const submit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (checking) return
    if (!isValidCode(code)) {
      setError('acct.errCode')
      return
    }
    setChecking(true)
    try {
      const secret = getTwoFactorSecret()
      if (secret && (await verifyTotp(secret, code))) onVerified()
      else setError('login.errWrongCode')
    } finally {
      setChecking(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="w-full max-w-sm">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-fg [&>svg]:h-6 [&>svg]:w-6"
      >
        <RolesIcon />
      </span>
      <h1 className="mt-4 text-2xl font-bold">{t('login.twoFactorTitle')}</h1>
      <p className="mt-1 text-sm text-muted">{t('login.twoFactorDesc')}</p>

      <div className="mt-6">
        <TextField
          label={t('acct.twoFactorCode')}
          inputMode="numeric"
          autoComplete="one-time-code"
          ref={codeRef}
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(v) => {
            setCode(v.replace(/\D/g, ''))
            setError(undefined)
          }}
          error={error}
        />
      </div>

      <Button type="submit" disabled={checking} className="mt-6 w-full py-2.5">
        {checking ? t('login.verifying') : t('login.verify')}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
      >
        <ArrowLeftIcon />
        {t('login.back')}
      </button>
    </form>
  )
}
