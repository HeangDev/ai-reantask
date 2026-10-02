import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/ui/Button'
import { LockIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import SectionCard from '@/features/account/components/SectionCard'
import TextField from '@/components/ui/TextField'
import { passwordStrength, validatePassword } from '@/features/account/lib/validation'
import { accountService } from '@/features/account/services/accountService'
import type { PasswordErrors, PasswordField, PasswordValues } from '@/features/account/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const EMPTY: PasswordValues = { current: '', next: '', confirm: '' }

const strengthLabels: TranslationKey[] = [
  'acct.strengthWeak',
  'acct.strengthWeak',
  'acct.strengthFair',
  'acct.strengthGood',
  'acct.strengthStrong',
]
const strengthColors = ['bg-line', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']

export default function PasswordSection() {
  const { t } = useI18n()
  const { notify } = useToast()
  const [values, setValues] = useState<PasswordValues>(EMPTY)
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [saving, setSaving] = useState(false)

  const set = (field: PasswordField) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    const found = validatePassword(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      await accountService.changePassword({ current: values.current, next: values.next })
      setValues(EMPTY)
      notify({ variant: 'info', title: t('acct.passwordChanged'), subtitle: t('acct.passwordChangedDesc') })
    } finally {
      setSaving(false)
    }
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
                  {t('acct.strength')}: {t(strengthLabels[strength])}
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
