import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Button } from '@/shared/components/Button'
import { LockIcon } from '@/shared/components/icons'
import { useToast } from '@/shared/components/Toast'
import { SectionCard } from '@/features/account/components/SectionCard'
import { TextField } from '@/shared/components/TextField'
import { passwordStrength, validatePassword } from '@/features/account/lib/validation'
import { useChangePassword } from '@/features/account/api/useChangePassword'
import type { PasswordErrors, PasswordField, PasswordValues } from '@/features/account/types'
import { useI18n } from '@/shared/i18n'
import { ApiError } from '@/shared/api/http'
import type { TranslationKey } from '@/shared/i18n'

const EMPTY: PasswordValues = { current: '', next: '', confirm: '' }

const strengthLabels: TranslationKey[] = [
  'acct.strengthWeak',
  'acct.strengthWeak',
  'acct.strengthFair',
  'acct.strengthGood',
  'acct.strengthStrong',
]
const strengthColors = ['bg-line', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']

export function PasswordSection() {
  const { t } = useI18n()
  const { notify } = useToast()
  const [values, setValues] = useState<PasswordValues>(EMPTY)
  const [errors, setErrors] = useState<PasswordErrors>({})
  const changePassword = useChangePassword()
  const saving = changePassword.isPending

  const set = (field: PasswordField) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    if (saving) return
    const found = validatePassword(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    changePassword.mutate(values, {
      onSuccess: () => {
        setValues(EMPTY)
        notify({ variant: 'info', title: t('acct.passwordChanged'), subtitle: t('acct.passwordChangedDesc') })
      },
      onError: (error) => {
        const code = error instanceof ApiError ? error.code : undefined
        const fields = error instanceof ApiError ? error.fieldErrors : {}
        if (code === 'INVALID_CURRENT_PASSWORD') setErrors({ current: 'acct.errCurrentWrong' })
        else if (code === 'PASSWORD_UNCHANGED') setErrors({ next: 'acct.errPasswordSame' })
        else if (fields.newPassword) setErrors({ next: 'acct.errPasswordRule' })
        else notify({ variant: 'danger', title: t('acct.passwordFailed'), subtitle: t('acct.passwordFailedDesc') })
      },
    })
  }

  const strength = passwordStrength(values.next)

  return (
    <SectionCard title={t('acct.passwordTitle')} description={t('acct.passwordDesc')} icon={<LockIcon />}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField
          label={t('acct.currentPassword')}
          type="password"
          autoComplete="current-password"
          value={values.current}
          onChange={set('current')}
          error={errors.current}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <TextField
              label={t('acct.newPassword')}
              type="password"
              autoComplete="new-password"
              value={values.next}
              onChange={set('next')}
              error={errors.next}
            />
            {values.next && (
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-colors ${step <= strength ? strengthColors[strength] : 'bg-line'}`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {t('acct.strength')}: {t(strengthLabels[strength] ?? strengthLabels[0] ?? 'acct.strength')}
                </p>
              </div>
            )}
          </div>
          <TextField
            label={t('acct.confirmPassword')}
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? t('acct.saving') : t('acct.updatePassword')}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}
