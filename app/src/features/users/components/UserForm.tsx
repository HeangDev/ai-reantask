import { useState } from 'react'
import type { FormEvent } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import FormDialog from '@/components/ui/FormDialog'
import TextField from '@/components/ui/TextField'
import type { Sex } from '@/features/students/types'
import { pickableSubjectNames, useSubjects } from '@/features/subjects/store/subjectsStore'
import { validateTeacher } from '@/features/teachers/lib/validation'
import { useTeachers } from '@/features/teachers/store/teachersStore'
import type { TeacherDetails } from '@/features/teachers/types'
import { userRoles } from '@/features/users/data/sampleUsers'
import { validateUser } from '@/features/users/lib/validation'
import type { AccountStatus, User, UserFormErrors, UserInput } from '@/features/users/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import { todayIso } from '@/lib/dates'

interface Props {
  /** The user being edited, or null when creating. */
  user: User | null
  /** Every user, used to catch duplicate emails. */
  users: User[]
  /** A user added with the Teacher role also brings the details a teacher profile needs. */
  onSave: (input: UserInput, teacher?: TeacherDetails) => void
  onClose: () => void
}

const TEACHER_ROLE = 'Teacher'

const fieldClass =
  'w-full rounded-lg border bg-sunken px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent'

export default function UserForm({ user, users, onSave, onClose }: Props) {
  const { t } = useI18n()
  const subjects = useSubjects()
  const teachers = useTeachers()
  const [values, setValues] = useState<UserInput>({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    role: user?.role ?? '',
    status: user?.status ?? 'active',
  })
  const [errors, setErrors] = useState<UserFormErrors>({})
  // Teacher details are only asked for when creating a user with the Teacher role.
  const [teacher, setTeacher] = useState<TeacherDetails>({ sex: '' as Sex, dateOfBirth: '', subject: '' })
  const [teacherErrors, setTeacherErrors] = useState<Partial<Record<keyof TeacherDetails, TranslationKey>>>({})
  const asTeacher = !user && values.role === TEACHER_ROLE

  const setTeacherField = <K extends keyof TeacherDetails>(field: K, value: TeacherDetails[K]) => {
    setTeacher((v) => ({ ...v, [field]: value }))
    setTeacherErrors((e) => ({ ...e, [field]: undefined }))
  }

  const set = <K extends keyof UserInput>(field: K, value: UserInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateUser(values, users.filter((x) => x.id !== user?.id))
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
      { ...values, fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim() },
      asTeacher ? teacher : undefined,
    )
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
          {asTeacher && (
            <>
              <p className="border-t border-line pt-3 text-sm font-semibold sm:col-span-2">
                {t('usr.teacherDetails')}
                <span className="mt-0.5 block text-xs font-normal text-muted">{t('usr.teacherHint')}</span>
              </p>
              <div>
                <label htmlFor="teacher-sex" className="text-sm font-medium">{t('stu.fieldSex')}</label>
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
              <TextField
                label={t('stu.fieldDob')}
                type="date"
                max={todayIso()}
                value={teacher.dateOfBirth}
                onChange={(v) => setTeacherField('dateOfBirth', v)}
                error={teacherErrors.dateOfBirth}
              />
              <div className="sm:col-span-2">
                <label htmlFor="teacher-subject" className="text-sm font-medium">{t('tch.subject')}</label>
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
            </>
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
          <Button type="submit">{t('stu.save')}</Button>
        </div>
      </form>
    </FormDialog>
  )
}
