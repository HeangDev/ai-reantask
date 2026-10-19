import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/Button'
import { ArrowLeftIcon, LockIcon } from '@/shared/components/icons'
import { TextField } from '@/shared/components/TextField'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useForgotPassword } from '@/features/auth/api/useAuthMutations'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { isValidEmail } from '@/shared/lib/validation'
import { paths } from '@/shared/config/paths'

const backClass =
  'mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4'

/** Asks for an email and sends a link to reset the password. */
export function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<TranslationKey>()
  const [failed, setFailed] = useState(false)
  const forgot = useForgotPassword()
  const submitting = forgot.isPending
  const [sentTo, setSentTo] = useState<string | null>(null)

  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    if (submitting) return
    setFailed(false)
    if (!isValidEmail(email)) {
      setError('stu.errEmail')
      return
    }

    const address = email.trim()
    forgot.mutate(address, {
      onSuccess: () => setSentTo(address),
      onError: () => setFailed(true),
    })
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
          <Link to={paths.login} className={backClass}>
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
            placeholder={t('field.emailPh')}
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
        <Link to={paths.login} className={backClass}>
          <ArrowLeftIcon />
          {t('login.back')}
        </Link>
      </form>
    </AuthLayout>
  )
}
