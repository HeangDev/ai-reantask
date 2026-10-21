import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/shared/components/Button'
import { DateField } from '@/shared/components/DateField'
import { Dropdown } from '@/shared/components/Dropdown'
import { EyeIcon, EyeOffIcon } from '@/shared/components/icons'
import { Modal } from '@/shared/components/Modal'
import { RequiredMark } from '@/shared/components/RequiredMark'
import { TextField } from '@/shared/components/TextField'
import type { Sex } from '@/features/students'
import { pickableSubjectNames, useSubjects } from '@/features/subjects'
import { useTeachers, validateTeacher } from '@/features/teachers'
import type { TeacherDetails } from '@/features/teachers'
import { roleLabelKey } from '@/features/auth'
import type { Role } from '@/features/auth'
import { useRoles } from '@/features/users/api/useUsers'
import { validateUser } from '@/features/users/lib/validation'
import { accountStatuses } from '@/features/users/types'
import type { AccountStatus, User, UserFormErrors, UserInput, UserSaveInput } from '@/features/users/types'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'
import { todayIso } from '@/shared/lib/dates'
import { usernameFromEmail } from '@/shared/lib/validation'

interface Props {
  /** Every user, used to catch duplicate emails. */
  users: User[]
  /** A user added with the Teacher role also brings the details a teacher profile needs. */
  onSave: (input: UserSaveInput, teacher?: TeacherDetails) => void
  onClose: () => void
  /** Errors the server reported for the last save; the wizard goes back to the step that holds the first one. */
  serverErrors?: UserFormErrors
  saving?: boolean
}

type Step = 1 | 2 | 3
type TeacherErrors = Partial<Record<keyof TeacherDetails, TranslationKey>>

const stepFields: Record<Step, (keyof UserFormErrors)[]> = {
  1: ['roleId'],
  2: ['fullName', 'email', 'phone'],
  3: ['password', 'confirm'],
}
const stepLabel: Record<Step, TranslationKey> = { 1: 'usr.stepRole', 2: 'usr.stepDetails', 3: 'usr.stepAccount' }
const roleDescription: Record<Role, TranslationKey> = {
  admin: 'usr.roleDescAdmin',
  teacher: 'usr.roleDescTeacher',
  student: 'usr.roleDescStudent',
}
const statusLabel: Record<AccountStatus, TranslationKey> = {
  PENDING: 'usr.pending',
  ACTIVE: 'usr.active',
  INACTIVE: 'usr.inactive',
  SUSPENDED: 'usr.suspended',
}
const steps: Step[] = [1, 2, 3]
const firstStepWith = (errors: UserFormErrors): Step | undefined =>
  steps.find((s) => stepFields[s].some((field) => errors[field]))

/** Add a user in three steps: role first (it decides which fields follow), then details, then password. */
export function UserWizard({ users, onSave, onClose, serverErrors, saving = false }: Props) {
  const { t } = useI18n()
  const subjects = useSubjects()
  const teachers = useTeachers()
  const roles = useRoles().data ?? []
  const [step, setStep] = useState<Step>(1)
  const [values, setValues] = useState<UserInput>({ fullName: '', email: '', phone: '', username: '', roleId: '', status: 'ACTIVE' })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [teacher, setTeacher] = useState<TeacherDetails>({ sex: '' as Sex, dateOfBirth: '', subject: '' })
  const [errors, setErrors] = useState<UserFormErrors>({})
  const [teacherErrors, setTeacherErrors] = useState<TeacherErrors>({})
  // A new batch of server errors is shown where it belongs: the wizard returns to that step.
  const [seenServerErrors, setSeenServerErrors] = useState(serverErrors)
  if (seenServerErrors !== serverErrors) {
    setSeenServerErrors(serverErrors)
    setErrors((e) => ({ ...e, ...serverErrors }))
    const target = serverErrors && firstStepWith(serverErrors)
    if (target) setStep(target)
  }

  const role = roles.find((r) => String(r.id) === values.roleId)
  const asTeacher = role?.name === 'teacher'

  const set = <K extends keyof UserInput>(field: K, value: UserInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }
  const setTeacherField = <K extends keyof TeacherDetails>(field: K, value: TeacherDetails[K]) => {
    setTeacher((v) => ({ ...v, [field]: value }))
    setTeacherErrors((e) => ({ ...e, [field]: undefined }))
  }

  /** Every problem found so far; only the fields of the step being left decide whether it may continue. */
  const validate = () => {
    const found = validateUser(values, users, { value: password, confirm })
    let foundTeacher: TeacherErrors = {}
    if (asTeacher) {
      const check = validateTeacher({ ...values, ...teacher, classes: [] }, teachers)
      foundTeacher = { sex: check.sex, dateOfBirth: check.dateOfBirth, subject: check.subject }
      if (!found.email && check.email === 'tch.errEmailTaken') found.email = 'tch.errEmailTaken'
    }
    return { found, foundTeacher }
  }

  const next = () => {
    const { found, foundTeacher } = validate()
    const blocked = stepFields[step].some((f) => found[f]) || (step === 2 && Object.values(foundTeacher).some(Boolean))
    // Only the fields of this step show errors, so the next step does not open already marked red.
    setErrors((e) => ({ ...e, ...Object.fromEntries(stepFields[step].map((field) => [field, found[field]])) }))
    if (step >= 2) setTeacherErrors(foundTeacher)
    if (blocked) return
    if (step < 3) {
      setStep((step + 1) as Step)
      return
    }
    if (saving) return
    const early = firstStepWith(found)
    if (early) {
      setStep(early)
      return
    }
    onSave(
      {
        ...values,
        fullName: values.fullName.trim(),
        username: usernameFromEmail(values.email),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password,
      },
      asTeacher ? teacher : undefined,
    )
  }

  const shown = (field: keyof UserFormErrors) => errors[field]
  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
      aria-pressed={showPassword}
      className="rounded-md p-1.5 text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
    >
      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  )

  const body: Record<Step, ReactNode> = {
    1: (
      <fieldset>
        <legend className="text-lg font-semibold">
          {t('usr.wizRoleTitle')}
          <RequiredMark />
        </legend>
        <p className="mt-1 text-sm text-muted">{t('usr.wizRoleHint')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {roles.map((r) => {
            const checked = values.roleId === String(r.id)
            return (
              <label
                key={r.id}
                className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  checked ? 'border-accent bg-accent-soft' : `${shown('roleId') ? 'border-red-500' : 'border-line'} bg-sunken hover:bg-hover`
                }`}
              >
                <input type="radio" name="user-role" className="sr-only" checked={checked} onChange={() => set('roleId', String(r.id))} />
                <span className="font-semibold">{t(roleLabelKey[r.name])}</span>
                <span className="mt-1 text-xs text-muted">{t(roleDescription[r.name])}</span>
              </label>
            )
          })}
        </div>
        {shown('roleId') && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{t(shown('roleId') as TranslationKey)}</p>}
      </fieldset>
    ),
    2: (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField label={t('stu.fieldName')} required autoComplete="off" value={values.fullName} onChange={(v) => set('fullName', v)} error={shown('fullName')} />
        </div>
        <TextField label={t('stu.fieldEmail')} required type="email" autoComplete="off" value={values.email} onChange={(v) => set('email', v)} error={shown('email')} />
        <TextField label={t('stu.fieldPhone')} required type="tel" autoComplete="off" value={values.phone} onChange={(v) => set('phone', v)} error={shown('phone')} />
        {asTeacher && (
          <>
            <p className="border-t border-line pt-3 text-sm font-semibold sm:col-span-2">
              {t('usr.teacherDetails')}
              <span className="mt-0.5 block text-xs font-normal text-muted">{t('usr.teacherHint')}</span>
            </p>
            <div>
              <label htmlFor="wizard-sex" className="text-sm font-medium">{t('stu.fieldSex')}<RequiredMark /></label>
              <div className="mt-1">
                <Dropdown
                  id="wizard-sex"
                  className="py-2"
                  invalid={Boolean(teacherErrors.sex)}
                  wrapperClassName="block w-full"
                  value={teacher.sex}
                  placeholder={t('stu.chooseSex')}
                  options={[{ value: 'male', label: t('stu.sexMale') }, { value: 'female', label: t('stu.sexFemale') }]}
                  onChange={(v) => setTeacherField('sex', v as Sex)}
                />
              </div>
              {teacherErrors.sex && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t(teacherErrors.sex)}</p>}
            </div>
            <DateField label={t('stu.fieldDob')} required max={todayIso()} value={teacher.dateOfBirth} onChange={(v) => setTeacherField('dateOfBirth', v)} error={teacherErrors.dateOfBirth} />
            <div className="sm:col-span-2">
              <label htmlFor="wizard-subject" className="text-sm font-medium">{t('tch.subject')}<RequiredMark /></label>
              <div className="mt-1">
                <Dropdown
                  id="wizard-subject"
                  className="py-2"
                  invalid={Boolean(teacherErrors.subject)}
                  wrapperClassName="block w-full"
                  value={teacher.subject}
                  placeholder={t('tch.chooseSubject')}
                  options={pickableSubjectNames(subjects).map((n) => ({ value: n, label: n }))}
                  onChange={(v) => setTeacherField('subject', v)}
                />
              </div>
              {teacherErrors.subject && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t(teacherErrors.subject)}</p>}
            </div>
          </>
        )}
      </div>
    ),
    3: (
      <div className="space-y-4">
        <p className="rounded-xl bg-sunken p-3 text-sm">
          <span className="block font-semibold">{values.fullName.trim()}</span>
          <span className="block text-xs text-muted">
            {values.email.trim()} · {role && t(roleLabelKey[role.name])}
          </span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('login.password')}
            required
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })) }}
            error={shown('password')}
            trailing={passwordToggle}
          />
          <TextField
            label={t('acct.confirmPassword')}
            required
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })) }}
            error={shown('confirm')}
          />
          <div className="sm:col-span-2">
            <label htmlFor="wizard-status" className="text-sm font-medium">{t('usr.status')}</label>
            <div className="mt-1">
              <Dropdown
                id="wizard-status"
                className="py-2"
                wrapperClassName="block w-full"
                value={values.status}
                options={accountStatuses.map((value) => ({ value, label: t(statusLabel[value]) }))}
                onChange={(v) => set('status', v as AccountStatus)}
              />
            </div>
          </div>
        </div>
      </div>
    ),
  }

  return (
    <Modal title={t('usr.formAdd')} onClose={onClose} size="lg" scroll={false}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          next()
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ol aria-label={t('usr.formAdd')} className="flex gap-2 border-b border-line px-5 py-3 text-xs">
          {steps.map((s) => (
            <li
              key={s}
              aria-current={s === step ? 'step' : undefined}
              className={`flex flex-1 items-center gap-2 font-medium ${s === step ? 'text-fg' : 'text-muted'}`}
            >
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${s <= step ? 'bg-accent-strong text-white' : 'bg-sunken'}`}
              >
                {s}
              </span>
              <span className="truncate">{t(stepLabel[s])}</span>
            </li>
          ))}
        </ol>
        <div className="min-h-64 flex-1 overflow-y-auto p-6">{body[step]}</div>
        <div className="flex items-center justify-between gap-2 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep((step - 1) as Step))}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {step === 1 ? t('dialog.cancel') : t('usr.back')}
          </button>
          <Button type="submit" disabled={saving}>
            {step === 3 ? t('usr.add') : t('usr.next')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
