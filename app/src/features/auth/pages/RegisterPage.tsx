import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { CheckIcon } from '@/components/ui/icons'
import TextField from '@/components/ui/TextField'
import { isAcceptablePassword } from '@/features/account/lib/validation'
import AuthLayout from '@/features/auth/components/AuthLayout'
import PasswordField from '@/features/auth/components/PasswordField'
import { authService } from '@/features/auth/services/authService'
import { registrationFor, registrationsActions } from '@/features/auth/store/registrationsStore'
import { getUsers } from '@/features/users/store/usersStore'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import { isValidEmail } from '@/lib/validation'

interface Values {
  fullName: string
  email: string
  password: string
  confirm: string
}
type Errors = Partial<Record<keyof Values, TranslationKey>>

const EMPTY: Values = { fullName: '', email: '', password: '', confirm: '' }

const linkClass =
  'rounded font-medium text-accent-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function validate(values: Values): Errors {
  const errors: Errors = {}
  if (!values.fullName.trim()) errors.fullName = 'acct.errName'
  if (!isValidEmail(values.email)) errors.email = 'stu.errEmail'
  if (!isAcceptablePassword(values.password)) errors.password = 'acct.errPasswordRule'
  if (values.confirm !== values.password) errors.confirm = 'acct.errPasswordMatch'
  return errors
}

/** Creating an account. Only students register themselves; an admin adds teachers from the Users page. */
export default function RegisterPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { notifyRole } = useToast()
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [failed, setFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdFor, setCreatedFor] = useState<string | null>(null)

  const set = (field: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const found = validate(values)
    setErrors(found)
    setFailed(false)
    if (Object.keys(found).length > 0) return

    // One account per email: a person who is registered (and not turned down) or already a user cannot register again.
    const email = values.email.trim()
    const existing = registrationFor(email)
    const taken =
      getUsers().some((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      (existing !== undefined && existing.status !== 'declined')
    if (taken) {
      setErrors({ email: 'register.errEmailTaken' })
      return
    }

    setSubmitting(true)
    try {
      await authService.register({ fullName: values.fullName.trim(), email, password: values.password })
      const name = values.fullName.trim()
      registrationsActions.register(name, email)
      // The new student cannot sign in until an admin or a teacher approves, so both are told.
      notifyRole('admin', {
        variant: 'info',
        title: t('reg.notifyTitle'),
        subtitle: t('reg.notifyDesc', { name }),
        to: '/users',
      })
      notifyRole('teacher', {
        variant: 'info',
        title: t('reg.notifyTitle'),
        subtitle: t('reg.notifyDesc', { name }),
        to: '/students',
      })
      setCreatedFor(email)
    } catch {
      setFailed(true)
    } finally {
      setSubmitting(false)
    }
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
          <Button type="button" onClick={() => navigate('/login')} className="mt-6 w-full py-2.5">
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
          R
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
            placeholder="you@example.com"
            value={values.email}
            onChange={set('email')}
            error={errors.email}
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

        <p className="mt-5 text-center text-sm text-muted">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className={linkClass}>
            {t('login.signIn')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
