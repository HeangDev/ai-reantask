import { useState } from 'react'
import type { ReactNode, SubmitEvent } from 'react'
import { Avatar } from '@/shared/components/Avatar'
import { Button } from '@/shared/components/Button'
import { DateField } from '@/shared/components/DateField'
import { Dropdown } from '@/shared/components/Dropdown'
import { RequiredMark } from '@/shared/components/RequiredMark'
import { FormDialog } from '@/shared/components/FormDialog'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, PhoneIcon, UserIcon } from '@/shared/components/icons'
import type { Sex } from '@/features/students'
import { useSubjects } from '@/features/subjects'
import { pickableSubjectNames } from '@/features/subjects'
import { validateTeacher } from '@/features/teachers'
import { useTeachers } from '@/features/teachers'
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
  /** The user being edited, or null when creating. */
  user: User | null
  /** Every user, used to catch duplicate emails. */
  users: User[]
  /** A user added with the Teacher role also brings the details a teacher profile needs. */
  onSave: (input: UserSaveInput, teacher?: TeacherDetails) => void
  onClose: () => void
  /** Errors the server reported for the last save, shown under their fields. */
  serverErrors?: UserFormErrors
  saving?: boolean
  /** Fixes the role (for example the Students page edits only students), so the role field is not shown. */
  lockedRole?: Role
}

const statusLabel: Record<AccountStatus, TranslationKey> = {
  PENDING: 'usr.pending',
  ACTIVE: 'usr.active',
  INACTIVE: 'usr.inactive',
  SUSPENDED: 'usr.suspended',
}

const sectionHeading = 'text-xs font-semibold uppercase tracking-wide text-muted sm:col-span-2'

const fieldClass =
  'w-full rounded-lg border bg-sunken px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent'

export function UserForm({ user, users, onSave, onClose, serverErrors, saving = false, lockedRole }: Props) {
  const { t } = useI18n()
  const subjects = useSubjects()
  const teachers = useTeachers()
  const roles = useRoles().data ?? []
  const [values, setValues] = useState<UserInput>({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    username: user?.username ?? '',
    roleId: user ? String(user.roleId) : '',
    status: user?.status ?? 'ACTIVE',
  })
  // A new user also gets a password; an existing user's password is never edited here.
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<UserFormErrors>({})
  // Server errors stay until that field is edited; a new batch of them resets this.
  const [seenServerErrors, setSeenServerErrors] = useState(serverErrors)
  const [edited, setEdited] = useState<Set<string>>(new Set())
  if (seenServerErrors !== serverErrors) {
    setSeenServerErrors(serverErrors)
    setEdited(new Set())
  }
  // Teacher details are only asked for when creating a user with the Teacher role.
  const [teacher, setTeacher] = useState<TeacherDetails>({ sex: '' as Sex, dateOfBirth: '', subject: '' })
  const [teacherErrors, setTeacherErrors] = useState<Partial<Record<keyof TeacherDetails, TranslationKey>>>({})
  const asTeacher = !user && roles.find((r) => String(r.id) === values.roleId)?.name === 'teacher'

  const setTeacherField = <K extends keyof TeacherDetails>(field: K, value: TeacherDetails[K]) => {
    setTeacher((v) => ({ ...v, [field]: value }))
    setTeacherErrors((e) => ({ ...e, [field]: undefined }))
  }

  const set = <K extends keyof UserInput>(field: K, value: UserInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
    setEdited((fields) => new Set(fields).add(field))
  }

  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    if (saving) return
    const found = validateUser(
      { ...values, roleId: lockedRole ? 'locked' : values.roleId },
      users.filter((x) => x.id !== user?.id),
      user ? undefined : { value: password, confirm },
    )
    let foundTeacher: typeof teacherErrors = {}
    if (asTeacher) {
      const check = validateTeacher({ ...values, ...teacher, classes: [] }, teachers)
      foundTeacher = { sex: check.sex, dateOfBirth: check.dateOfBirth, subject: check.subject }
      // The email must also be free among the teachers.
      if (!found.email && check.email === 'tch.errEmailTaken') found.email = 'tch.errEmailTaken'
    }
    setErrors(found)
    setTeacherErrors(foundTeacher)
    if (Object.keys(found).length > 0 || Object.values(foundTeacher).some(Boolean)) return
    onSave(
      {
        ...values,
        fullName: values.fullName.trim(),
        // The form has no username field; the API needs one, so a new user gets one made from the email.
        username: user ? user.username : usernameFromEmail(values.email),
        roleId: lockedRole ? String(roles.find((r) => r.name === lockedRole)?.id ?? values.roleId) : values.roleId,
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: user ? undefined : password,
      },
      asTeacher ? teacher : undefined,
    )
  }

  const field = (
    name: keyof UserInput | 'password' | 'confirm',
    label: string,
    input: (props: object) => React.ReactNode,
    span?: 'full',
    adornments?: { icon?: ReactNode; trailing?: ReactNode },
  ) => {
    const error = errors[name] ?? (edited.has(name) ? undefined : serverErrors?.[name])
    return (
      <div className={span ? 'sm:col-span-2' : undefined}>
        <label htmlFor={`user-${name}`} className="text-sm font-medium">{label}{name !== 'status' && <RequiredMark />}</label>
        <div className="relative mt-1">
          {adornments?.icon && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
              {adornments.icon}
            </span>
          )}
          {input({
            id: `user-${name}`,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error ? `user-${name}-error` : undefined,
            className: `${fieldClass} ${adornments?.icon ? 'pl-9' : ''} ${adornments?.trailing ? 'pr-10' : ''} ${error ? 'border-red-500' : 'border-line'}`,
          })}
          {adornments?.trailing && <span className="absolute inset-y-0 right-1.5 flex items-center">{adornments.trailing}</span>}
        </div>
        {error && (
          <p id={`user-${name}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">{t(error)}</p>
        )}
      </div>
    )
  }

  const roleError = errors.roleId ?? (edited.has('roleId') ? undefined : serverErrors?.roleId)
  const roleName = roles.find((r) => String(r.id) === values.roleId)?.name
  const preview = (
    <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-sm">
      <div className="flex justify-center">
        <Avatar name={values.fullName} src={user?.avatar} size="xl" />
      </div>
      <p className="mt-3 truncate font-semibold">{values.fullName.trim() || t('stu.fieldName')}</p>
      <p className="truncate text-xs text-muted">{values.email.trim() || t('stu.fieldEmail')}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
        {[roleName && t(roleLabelKey[roleName]), t(statusLabel[values.status])]
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
        <div className="flex-1 space-y-6 overflow-y-auto p-6 pt-12 md:pt-6">
          <section aria-labelledby="user-section-profile" className="grid gap-4 sm:grid-cols-2">
            <h3 id="user-section-profile" className={sectionHeading}>{t('usr.sectionProfile')}</h3>
            {field('fullName', t('stu.fieldName'), (props) => (
              <input {...props} type="text" autoComplete="off" value={values.fullName} onChange={(e) => set('fullName', e.target.value)} />
            ), 'full', { icon: <UserIcon /> })}
            {field('email', t('stu.fieldEmail'), (props) => (
              <input {...props} type="email" autoComplete="off" disabled={Boolean(user)} value={values.email} onChange={(e) => set('email', e.target.value)} />
            ), undefined, { icon: <MailIcon /> })}
            {field('phone', t('stu.fieldPhone'), (props) => (
              <input {...props} type="tel" autoComplete="off" value={values.phone} onChange={(e) => set('phone', e.target.value)} />
            ), undefined, { icon: <PhoneIcon /> })}
          </section>

          <section aria-labelledby="user-section-access" className="grid gap-4 sm:grid-cols-2">
            <h3 id="user-section-access" className={sectionHeading}>{t('usr.sectionAccess')}</h3>
            {!lockedRole && (
              <fieldset className="sm:col-span-2" aria-describedby={roleError ? 'user-roleId-error' : undefined}>
                <legend className="text-sm font-medium">{t('usr.role')}<RequiredMark /></legend>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {roles.map((r) => {
                    const checked = values.roleId === String(r.id)
                    return (
                      <label
                        key={r.id}
                        className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                          checked ? 'border-accent bg-accent-soft text-fg' : `${roleError ? 'border-red-500' : 'border-line'} bg-sunken text-muted hover:bg-hover`
                        }`}
                      >
                        <input
                          type="radio"
                          name="user-role"
                          className="sr-only"
                          checked={checked}
                          onChange={() => set('roleId', String(r.id))}
                        />
                        {t(roleLabelKey[r.name])}
                      </label>
                    )
                  })}
                </div>
                {roleError && <p id="user-roleId-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{t(roleError)}</p>}
              </fieldset>
            )}
            {field('status', t('usr.status'), (props) => (
              <Dropdown
                {...props}
                className="py-2"
                wrapperClassName="block w-full"
                value={values.status}
                placeholder={t('usr.chooseStatus')}
                options={accountStatuses.map((value) => ({ value, label: t(statusLabel[value]) }))}
                onChange={(v) => set('status', v as AccountStatus)}
              />
            ))}
          </section>

          {!user && (
            <section aria-labelledby="user-section-security" className="grid gap-4 sm:grid-cols-2">
              <h3 id="user-section-security" className={sectionHeading}>{t('usr.sectionSecurity')}</h3>
              {field('password', t('login.password'), (props) => (
                <input {...props} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: undefined })); setEdited((f) => new Set(f).add('password')) }} />
              ), undefined, {
                icon: <LockIcon />,
                trailing: (
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    aria-pressed={showPassword}
                    className="rounded-md p-1.5 text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                ),
              })}
              {field('confirm', t('acct.confirmPassword'), (props) => (
                <input {...props} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setErrors((er) => ({ ...er, confirm: undefined })) }} />
              ), undefined, { icon: <LockIcon /> })}
            </section>
          )}

          {asTeacher && (
            <section aria-labelledby="user-section-teacher" className="grid gap-4 sm:grid-cols-2">
              <h3 id="user-section-teacher" className={sectionHeading}>
                {t('usr.teacherDetails')}
                <span className="mt-0.5 block text-xs font-normal normal-case tracking-normal text-muted">{t('usr.teacherHint')}</span>
              </h3>
              <div>
                <label htmlFor="teacher-sex" className="text-sm font-medium">{t('stu.fieldSex')}<RequiredMark /></label>
                <div className="mt-1">
                  <Dropdown
                    id="teacher-sex"
                    className="py-2"
                    invalid={Boolean(teacherErrors.sex)}
                    wrapperClassName="block w-full"
                    value={teacher.sex}
                    placeholder={t('stu.chooseSex')}
                    options={[
                      { value: 'male', label: t('stu.sexMale') },
                      { value: 'female', label: t('stu.sexFemale') },
                    ]}
                    onChange={(v) => setTeacherField('sex', v as Sex)}
                  />
                </div>
                {teacherErrors.sex && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t(teacherErrors.sex)}</p>}
              </div>
              <DateField
                label={t('stu.fieldDob')}
                required
                max={todayIso()}
                value={teacher.dateOfBirth}
                onChange={(v) => setTeacherField('dateOfBirth', v)}
                error={teacherErrors.dateOfBirth}
              />
              <div className="sm:col-span-2">
                <label htmlFor="teacher-subject" className="text-sm font-medium">{t('tch.subject')}<RequiredMark /></label>
                <div className="mt-1">
                  <Dropdown
                    id="teacher-subject"
                    className="py-2"
                    invalid={Boolean(teacherErrors.subject)}
                    wrapperClassName="block w-full"
                    value={teacher.subject}
                    placeholder={t('tch.chooseSubject')}
                    options={pickableSubjectNames(subjects).map((n) => ({ value: n, label: n }))}
                    onChange={(v) => setTeacherField('subject', v)}
                  />
                </div>
                {teacherErrors.subject && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t(teacherErrors.subject)}</p>
                )}
              </div>
            </section>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('dialog.cancel')}
          </button>
          <Button type="submit" disabled={saving}>
            {t('stu.save')}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}
