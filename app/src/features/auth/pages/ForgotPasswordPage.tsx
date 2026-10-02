import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { ArrowLeftIcon, LockIcon } from '@/components/ui/icons'
import TextField from '@/components/ui/TextField'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { authService } from '@/features/auth/services/authService'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import { isValidEmail } from '@/lib/validation'

const backClass =
  'mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4'

/** Asks for an email and sends a link to reset the password. */
export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<TranslationKey>()
  const [failed, setFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setFailed(false)
    if (!isValidEmail(email)) {
      setError('stu.errEmail')
      return
    }

    setSubmitting(true)
    try {
      await authService.requestPasswordReset(email.trim())
      setSentTo(email.trim())
    } catch {
      setFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-fg ring-8 ring-accent-soft/40 [&>svg]:h-6 [&>svg]:w-6"
          >
            <LockIcon />
          </span>
          <h1 className="mt-5 text-2xl font-bold">{t('forgot.sentTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('forgot.sentDesc', { email: sentTo })}</p>
          <Link to="/login" className={backClass}>
            <ArrowLeftIcon />
            {t('login.back')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} noValidate className="w-full max-w-sm">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-fg [&>svg]:h-6 [&>svg]:w-6"
        >
          <LockIcon />
        </span>
        <h1 className="mt-4 text-2xl font-bold">{t('forgot.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('forgot.subtitle')}</p>

        {failed && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            {t('forgot.errFailed')}
          </p>
        )}

        <div className="mt-6">
          <TextField
            label={t('acct.email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(v) => {
              setEmail(v)
              setError(undefined)
            }}
            error={error}
          />
        </div>

        <Button type="submit" disabled={submitting} className="mt-6 w-full py-2.5">
          {submitting ? t('forgot.sending') : t('forgot.submit')}
        </Button>
        <Link to="/login" className={backClass}>
          <ArrowLeftIcon />
          {t('login.back')}
        </Link>
      </form>
    </AuthLayout>
  )
}
