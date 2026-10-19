import { APP_NAME } from '@/shared/hooks/useDocumentTitle'
import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/Button'
import { CheckIcon } from '@/shared/components/icons'
import { TextField } from '@/shared/components/TextField'
import { isAcceptablePassword } from '@/features/auth/lib/validation'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton'
import { OrDivider } from '@/features/auth/components/OrDivider'
import { PasswordField } from '@/features/auth/components/PasswordField'
import { roleHome } from '@/features/auth/lib/access'
import { useGoogleAuth, useRegister } from '@/features/auth/api/useAuthMutations'
import { authActions } from '@/shared/store/authStore'
import { getDeviceName } from '@/shared/lib/deviceName'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { isValidEmail, isValidPhone, usernameFromEmail } from '@/shared/lib/validation'
import { paths } from '@/shared/config/paths'

interface Values {
  fullName: string
  email: string
  phone: string
  password: string
  confirm: string
}
type Errors = Partial<Record<keyof Values, TranslationKey>>

const EMPTY: Values = { fullName: '', email: '', phone: '', password: '', confirm: '' }

const linkClass =
  'rounded font-medium text-accent-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function validate(values: Values): Errors {
  const errors: Errors = {}
  if (!values.fullName.trim()) errors.fullName = 'acct.errName'
  if (!isValidEmail(values.email)) errors.email = 'stu.errEmail'
  if (!isValidPhone(values.phone)) errors.phone = 'stu.errPhone'
  if (!isAcceptablePassword(values.password)) errors.password = 'acct.errPasswordRule'
  if (values.confirm !== values.password) errors.confirm = 'acct.errPasswordMatch'
  return errors
}

/** Creating an account. Only students register themselves; an admin adds teachers from the Users page. */
export function RegisterPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [failed, setFailed] = useState(false)
  const [googleFailed, setGoogleFailed] = useState(false)
  const register = useRegister()
  const google = useGoogleAuth()
  const submitting = register.isPending || google.isPending
  const [createdFor, setCreatedFor] = useState<string | null>(null)

  const set = (field: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const signUpWithGoogle = (credential: string) => {
    if (submitting) return
    setFailed(false)
    setGoogleFailed(false)
    google.mutate(
      { credential, device_name: getDeviceName() },
      {
        onSuccess: (auth) => {
          // A first-time Google user is created as a pending student and waits for approval, like a password sign-up.
          if (!('token' in auth)) {
            setCreatedFor(auth.email)
            return
          }
          // The Google account already belongs to an approved user, so sign in instead.
          authActions.signIn(auth.user.role.name, auth.user.email, auth.token)
          void navigate(roleHome[auth.user.role.name])
        },
        onError: (error) => {
          // An existing account that is still waiting for approval.
          if (error instanceof ApiError && error.code === 'ACCOUNT_PENDING') void navigate(paths.login)
          else setGoogleFailed(true)
        },
      },
    )
  }

  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    if (submitting) return
    const found = validate(values)
    setErrors(found)
    setFailed(false)
    setGoogleFailed(false)
    if (Object.keys(found).length > 0) return

    const email = values.email.trim()
    register.mutate(
      {
        fullname: values.fullName.trim(),
        // The form has no username field; the API needs one, so it is made from the email.
        username: usernameFromEmail(email),
        email,
        phone: values.phone.trim(),
        password: values.password,
        password_confirmation: values.confirm,
      },
      {
        onSuccess: () => setCreatedFor(email),
        onError: (error) => {
          // The server enforces unique emails and phone numbers; the username is made from the email, so a clash on it is shown on the email field.
          const fields = error instanceof ApiError && error.status === 422 ? error.fieldErrors : {}
          const serverErrors: Errors = {}
          if (fields.email || fields.username) serverErrors.email = 'register.errEmailTaken'
          if (fields.phone) serverErrors.phone = 'register.errPhoneTaken'
          if (fields.password) serverErrors.password = 'acct.errPasswordRule'
          if (Object.keys(serverErrors).length > 0) setErrors(serverErrors)
          else setFailed(true)
        },
      },
    )
  }

  if (createdFor) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/5 [&>svg]:h-6 [&>svg]:w-6"
          >
            <CheckIcon />
          </span>
          <h1 className="mt-5 text-2xl font-bold">{t('register.successTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('register.successDesc', { email: createdFor })}</p>
          <Button type="button" onClick={() => navigate(paths.login)} className="mt-6 w-full py-2.5">
            {t('register.goSignIn')}
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} noValidate className="w-full max-w-sm">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-accent-strong to-violet-500 text-lg font-bold text-white shadow-sm lg:hidden"
        >
          {APP_NAME.charAt(0)}
        </span>
        <h1 className="mt-4 text-2xl font-bold lg:mt-0">{t('register.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('register.subtitle')}</p>

        {failed && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            {t('register.errFailed')}
          </p>
        )}

        {googleFailed && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            {t('auth.googleFailed')}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <TextField
            label={t('acct.fullName')}
            autoComplete="name"
            value={values.fullName}
            onChange={set('fullName')}
            error={errors.fullName}
          />
          <TextField
            label={t('acct.email')}
            type="email"
            autoComplete="email"
            placeholder={t('field.emailPh')}
            value={values.email}
            onChange={set('email')}
            error={errors.email}
          />
          <TextField
            label={t('stu.fieldPhone')}
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={set('phone')}
            error={errors.phone}
          />
          <PasswordField
            label={t('login.password')}
            autoComplete="new-password"
            value={values.password}
            onChange={set('password')}
            error={errors.password}
            hint={t('acct.errPasswordRule')}
          />
          <PasswordField
            label={t('acct.confirmPassword')}
            autoComplete="new-password"
            value={values.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
          />
        </div>

        <Button type="submit" disabled={submitting} className="mt-6 w-full py-2.5">
          {submitting ? t('register.submitting') : t('register.submit')}
        </Button>

        <OrDivider />
        <GoogleAuthButton text="signup_with" disabled={submitting} onCredential={signUpWithGoogle} />

        <p className="mt-5 text-center text-sm text-muted">
          {t('register.haveAccount')}{' '}
          <Link to={paths.login} className={linkClass}>
            {t('login.signIn')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
