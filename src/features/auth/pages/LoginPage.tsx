import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import RouteTitle from '@/app/RouteTitle'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import { AssignmentsIcon, CheckIcon, EyeIcon, EyeOffIcon, GlobeIcon, StudentsIcon, TasksIcon, TeachersIcon } from '@/components/ui/icons'
import TextField from '@/components/ui/TextField'
import { getTwoFactorSecret } from '@/features/account/store/accountStore'
import TwoFactorStep from '@/features/auth/components/TwoFactorStep'
import { roleHome } from '@/features/auth/lib/access'
import { authService } from '@/features/auth/services/authService'
import { authActions } from '@/features/auth/store/authStore'
import { roles } from '@/features/auth/types'
import type { Role } from '@/features/auth/types'
import { languageNames, useI18n } from '@/lib/i18n'
import type { Language, TranslationKey } from '@/lib/i18n'
import { isValidEmail } from '@/lib/validation'

const features = [
  { icon: <AssignmentsIcon />, key: 'login.feature1' },
  { icon: <TasksIcon />, key: 'login.feature2' },
  { icon: <CheckIcon />, key: 'login.feature3' },
] as const

const roleOptions: Record<Role, { icon: ReactNode; labelKey: TranslationKey }> = {
  teacher: { icon: <TeachersIcon />, labelKey: 'role.teacher' },
  student: { icon: <StudentsIcon />, labelKey: 'role.student' },
}

interface Errors {
  email?: TranslationKey
  password?: TranslationKey
}

export default function LoginPage() {
  const { t, language, setLanguage } = useI18n()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('teacher')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [failed, setFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // After the password, a second step asks for the authenticator code when two-factor authentication is on.
  const [step, setStep] = useState<'credentials' | 'code'>('credentials')

  const finishSignIn = () => {
    authActions.signIn(role)
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
    if (Object.keys(found).length > 0) return

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
    <div className="grid min-h-screen bg-canvas text-fg lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <RouteTitle />

      <aside className="relative hidden overflow-hidden bg-linear-to-br from-accent-strong to-violet-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold backdrop-blur-sm"
          >
            R
          </span>
          <span className="text-xl font-semibold">ReanTask</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">{t('login.heroTitle')}</h2>
          <p className="mt-4 text-base text-white/80">{t('login.heroDesc')}</p>
          <ul className="mt-8 space-y-3">
            {features.map((feature) => (
              <li key={feature.key} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm [&>svg]:h-4 [&>svg]:w-4"
                >
                  {feature.icon}
                </span>
                {t(feature.key)}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">© ReanTask</p>
      </aside>

      <main className="flex flex-col p-4 sm:p-8">
        <div className="flex justify-end">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span aria-hidden="true" className="[&>svg]:h-4 [&>svg]:w-4">
              <GlobeIcon />
            </span>
            <span className="sr-only">{t('header.language')}</span>
            <Dropdown
              value={language}
              onChange={(v) => setLanguage(v as Language)}
              options={(Object.keys(languageNames) as Language[]).map((code) => ({ value: code, label: languageNames[code] }))}
              wrapperClassName="w-36"
            />
          </label>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
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
                <div className="mt-1 grid grid-cols-2 gap-2">
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
                      <span className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-fg peer-checked:ring-2 peer-checked:ring-accent/30 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4">
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
                <TextField
                  label={t('login.password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(v) => {
                    setPassword(v)
                    setErrors((er) => ({ ...er, password: undefined }))
                  }}
                  error={errors.password}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={t(showPassword ? 'login.hidePassword' : 'login.showPassword')}
                      aria-pressed={showPassword}
                      className="rounded p-1 text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  }
                />
              </div>

              <Button type="submit" disabled={submitting} className="mt-6 w-full py-2.5">
                {submitting ? t('login.signingIn') : t('login.signIn')}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
