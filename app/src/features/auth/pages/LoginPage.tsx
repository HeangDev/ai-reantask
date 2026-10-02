import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { RolesIcon, StudentsIcon, TeachersIcon } from '@/components/ui/icons'
import TextField from '@/components/ui/TextField'
import { getTwoFactorSecret } from '@/features/account/store/accountStore'
import AuthLayout from '@/features/auth/components/AuthLayout'
import PasswordField from '@/features/auth/components/PasswordField'
import TwoFactorStep from '@/features/auth/components/TwoFactorStep'
import { roleHome } from '@/features/auth/lib/access'
import { authService } from '@/features/auth/services/authService'
import { authActions } from '@/features/auth/store/authStore'
import { registrationFor, useRegistrations } from '@/features/auth/store/registrationsStore'
import { roles } from '@/features/auth/types'
import type { Role } from '@/features/auth/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import { isValidEmail } from '@/lib/validation'

const roleOptions: Record<Role, { icon: ReactNode; labelKey: TranslationKey }> = {
  teacher: { icon: <TeachersIcon />, labelKey: 'role.teacher' },
  student: { icon: <StudentsIcon />, labelKey: 'role.student' },
  admin: { icon: <RolesIcon />, labelKey: 'role.admin' },
}

interface Errors {
  email?: TranslationKey
  password?: TranslationKey
}

const linkClass =
  'rounded font-medium text-accent-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export default function LoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('teacher')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [failed, setFailed] = useState(false)
  // Worked out as the email is typed: an account that registered but is not approved yet (or was turned down)
  // may not sign in, and the person is told straight away instead of after pressing Sign in.
  useRegistrations() // re-check when an admin or teacher answers
  const registration = isValidEmail(email) ? registrationFor(email) : undefined
  const blocked: TranslationKey | undefined =
    registration && registration.status !== 'approved'
      ? registration.status === 'pending'
        ? 'login.errPending'
        : 'login.errDeclined'
      : undefined
  const [submitting, setSubmitting] = useState(false)
  // After the password, a second step asks for the authenticator code when two-factor authentication is on.
  const [step, setStep] = useState<'credentials' | 'code'>('credentials')

  const finishSignIn = () => {
    authActions.signIn(role, email)
    navigate(roleHome[role])
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const found: Errors = {}
    if (!isValidEmail(email)) found.email = 'stu.errEmail'
    if (!password) found.password = 'login.errPassword'
    setErrors(found)
    setFailed(false)
    if (Object.keys(found).length > 0 || blocked) return

    setSubmitting(true)
    try {
      await authService.signIn({ email: email.trim(), password })
      if (getTwoFactorSecret()) setStep('code')
      else finishSignIn()
    } catch {
      setFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      {step === 'code' ? (
        <TwoFactorStep onVerified={finishSignIn} onBack={() => setStep('credentials')} />
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

          <fieldset className="mt-6">
            <legend className="text-sm font-medium">{t('login.signInAs')}</legend>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {roles.map((value) => (
                <label key={value} className="relative flex cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                    className="peer sr-only"
                  />
                  <span className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-fg peer-checked:ring-2 peer-checked:ring-accent/30 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4">
                    {roleOptions[value].icon}
                    {t(roleOptions[value].labelKey)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 space-y-4">
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
            {blocked && (
              <p
                role="alert"
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
              >
                {t(blocked)}
              </p>
            )}

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

          <Button type="submit" disabled={submitting || Boolean(blocked)} className="mt-4 w-full py-2.5">
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
