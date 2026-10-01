import { useState } from 'react'
import type { FormEvent } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import FormDialog from '@/components/ui/FormDialog'
import { userRoles } from '@/features/users/data/sampleUsers'
import { validateUser } from '@/features/users/lib/validation'
import type { AccountStatus, User, UserFormErrors, UserInput } from '@/features/users/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** The user being edited, or null when creating. */
  user: User | null
  /** Every user, used to catch duplicate emails. */
  users: User[]
  onSave: (input: UserInput) => void
  onClose: () => void
}

const fieldClass =
  'w-full rounded-lg border bg-sunken px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent'

export default function UserForm({ user, users, onSave, onClose }: Props) {
  const { t } = useI18n()
  const [values, setValues] = useState<UserInput>({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    role: user?.role ?? '',
    status: user?.status ?? 'active',
  })
  const [errors, setErrors] = useState<UserFormErrors>({})

  const set = <K extends keyof UserInput>(field: K, value: UserInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateUser(values, users.filter((x) => x.id !== user?.id))
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSave({ ...values, fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim() })
  }

  const field = (
    name: keyof UserInput,
    label: string,
    input: (props: object) => React.ReactNode,
    span?: 'full',
  ) => {
    const error = errors[name]
    return (
      <div className={span ? 'sm:col-span-2' : undefined}>
        <label htmlFor={`user-${name}`} className="text-sm font-medium">{label}</label>
        <div className="mt-1">
          {input({
            id: `user-${name}`,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error ? `user-${name}-error` : undefined,
            className: `${fieldClass} ${error ? 'border-red-500' : 'border-line'}`,
          })}
        </div>
        {error && (
          <p id={`user-${name}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">{t(error)}</p>
        )}
      </div>
    )
  }

  const preview = (
    <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-sm">
      <div className="flex justify-center">
        <Avatar name={values.fullName} size="xl" />
      </div>
      <p className="mt-3 truncate font-semibold">{values.fullName.trim() || t('stu.fieldName')}</p>
      <p className="truncate text-xs text-muted">{values.email.trim() || t('stu.fieldEmail')}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
        {[values.role, t(values.status === 'active' ? 'usr.active' : 'usr.inactive')]
          .filter(Boolean)
          .map((chip) => (
            <span key={chip} className="rounded-md bg-sunken px-2 py-0.5 font-medium">{chip}</span>
          ))}
      </div>
    </div>
  )

  return (
    <FormDialog
      title={user ? t('usr.formEdit') : t('usr.formAdd')}
      description={user ? user.fullName : t('usr.formAddDesc')}
      preview={preview}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6 pt-12 sm:grid-cols-2 md:pt-6">
          {field('fullName', t('stu.fieldName'), (props) => (
            <input {...props} type="text" autoComplete="off" value={values.fullName} onChange={(e) => set('fullName', e.target.value)} />
          ), 'full')}
          {field('phone', t('stu.fieldPhone'), (props) => (
            <input {...props} type="tel" autoComplete="off" value={values.phone} onChange={(e) => set('phone', e.target.value)} />
          ))}
          {field('email', t('stu.fieldEmail'), (props) => (
            <input {...props} type="email" autoComplete="off" value={values.email} onChange={(e) => set('email', e.target.value)} />
          ))}
          {field('role', t('usr.role'), (props) => (
            <Dropdown
              {...props}
              className="py-2"
              invalid={Boolean(errors.role)}
              wrapperClassName="block w-full"
              value={values.role}
              placeholder={t('usr.chooseRole')}
              options={userRoles.map((r) => ({ value: r, label: r }))}
              onChange={(v) => set('role', v)}
            />
          ))}
          {field('status', t('usr.status'), (props) => (
            <Dropdown
              {...props}
              className="py-2"
              wrapperClassName="block w-full"
              value={values.status}
              placeholder={t('usr.chooseStatus')}
              options={[
                { value: 'active', label: t('usr.active') },
                { value: 'inactive', label: t('usr.inactive') },
              ]}
              onChange={(v) => set('status', v as AccountStatus)}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('dialog.cancel')}
          </button>
          <Button type="submit">{t('stu.save')}</Button>
        </div>
      </form>
    </FormDialog>
  )
}
