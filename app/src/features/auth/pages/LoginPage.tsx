import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { ClockIcon } from '@/components/ui/icons'
import TextField from '@/components/ui/TextField'
import { getTwoFactorSecret } from '@/features/account/store/accountStore'
import AuthLayout from '@/features/auth/components/AuthLayout'
import PasswordField from '@/features/auth/components/PasswordField'
import TwoFactorStep from '@/features/auth/components/TwoFactorStep'
import { roleHome } from '@/features/auth/lib/access'
import { useLogin } from '@/features/auth/hooks/useAuthMutations'
import { authActions } from '@/features/auth/store/authStore'
import type { AuthResult } from '@/features/auth/types'
import { getDeviceName } from '@/lib/deviceName'
import { ApiError } from '@/lib/apiClient'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import { isValidEmail } from '@/lib/validation'

interface Errors {
  email?: TranslationKey
  password?: TranslationKey
}

const linkClass =
  'rounded font-medium text-accent-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export default function LoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [failed, setFailed] = useState(false)
  const [pending, setPending] = useState(false)
  const login = useLogin()
  const submitting = login.isPending
  // After the password, a second step asks for the authenticator code when two-factor authentication is on.
  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [result, setResult] = useState<AuthResult | null>(null)

  const finishSignIn = (auth: AuthResult) => {
    authActions.signIn(auth.user.role.name, auth.user.email, auth.token)
    navigate(roleHome[auth.user.role.name])
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const found: Errors = {}
    if (!isValidEmail(email)) found.email = 'stu.errEmail'
    if (!password) found.password = 'login.errPassword'
    setErrors(found)
    setFailed(false)
    setPending(false)
    if (Object.keys(found).length > 0) return

    login.mutate(
      { email: email.trim(), password, device_name: getDeviceName() },
      {
        onSuccess: (auth) => {
          if (getTwoFactorSecret()) {
            setResult(auth)
            setStep('code')
          } else finishSignIn(auth)
        },
        onError: (error) => {
          // The password was right but an admin or a teacher has not approved the account yet.
          if (error instanceof ApiError && error.code === 'ACCOUNT_PENDING') setPending(true)
          else setFailed(true)
        },
      },
    )
  }

  return (
    <AuthLayout>
      {step === 'code' ? (
        <TwoFactorStep onVerified={() => result && finishSignIn(result)} onBack={() => setStep('credentials')} />
      ) : (
        <form onSubmit={submit} noValidate className="w-full max-w-sm">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-accent-strong to-violet-500 text-lg font-bold text-white shadow-sm lg:hidden"
          >
            R
          </span>
          <h1 className="mt-4 text-2xl font-bold lg:mt-0">{t('login.welcome')}</h1>
          <p className="mt-1 text-sm text-muted">{t('login.subtitle')}</p>

          {failed && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              {t('login.errFailed')}
            </p>
          )}

          {pending && (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200 [&>svg]:h-5 [&>svg]:w-5"
              >
                <ClockIcon />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t('login.pendingTitle')}</p>
                <p className="mt-0.5 text-sm">{t('login.errPending')}</p>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <TextField
              label={t('acct.email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(v) => {
                setEmail(v)
                setErrors((er) => ({ ...er, email: undefined }))
              }}
              error={errors.email}
            />
            <div>
              <PasswordField
                label={t('login.password')}
                autoComplete="current-password"
                value={password}
                onChange={(v) => {
                  setPassword(v)
                  setErrors((er) => ({ ...er, password: undefined }))
                }}
                error={errors.password}
              />
              <p className="mt-2 text-right text-sm">
                <Link to="/forgot-password" className={linkClass}>
                  {t('login.forgot')}
                </Link>
              </p>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="mt-4 w-full py-2.5">
            {submitting ? t('login.signingIn') : t('login.signIn')}
          </Button>

          <p className="mt-5 text-center text-sm text-muted">
            {t('login.noAccount')}{' '}
            <Link to="/register" className={linkClass}>
              {t('login.createAccount')}
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
