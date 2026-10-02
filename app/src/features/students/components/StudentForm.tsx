import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Avatar from '@/components/ui/Avatar'
import FormDialog from '@/components/ui/FormDialog'
import type { ActiveStatus } from '@/components/ui/StatusBadge'
import { useSession } from '@/features/auth/store/authStore'
import { useCurrentTeacher } from '@/features/teachers/hooks/useCurrentTeacher'
import { useTeachers } from '@/features/teachers/store/teachersStore'
import { validateStudent } from '@/features/students/lib/validation'
import { ageFrom, todayIso } from '@/lib/dates'
import type { Sex, Student, StudentFormErrors, StudentInput } from '@/features/students/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** The student being edited, or null when creating. */
  student: Student | null
  /** Every student, used to catch duplicate emails. */
  students: Student[]
  onSave: (input: StudentInput) => void
  onClose: () => void
}

const fieldClass =
  'w-full rounded-lg border bg-sunken px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent'

export default function StudentForm({ student, students, onSave, onClose }: Props) {
  const { t } = useI18n()
  const isTeacher = useSession()?.role === 'teacher'
  const currentTeacher = useCurrentTeacher()
  const teachers = useTeachers()
  // A teacher can only add students to themselves; an admin chooses any teacher.
  const teacherOptions = isTeacher ? (currentTeacher ? [currentTeacher.fullName] : []) : teachers.map((x) => x.fullName)
  const [values, setValues] = useState<StudentInput>({
    fullName: student?.fullName ?? '',
    email: student?.email ?? '',
    teacher: student?.teacher ?? (isTeacher ? (currentTeacher?.fullName ?? '') : ''),
    dateOfBirth: student?.dateOfBirth ?? '',
    // Empty until chosen; validation rejects it before it can be saved.
    sex: student?.sex ?? ('' as Sex),
    phone: student?.phone ?? '',
    status: student?.status ?? 'active',
  })
  const [errors, setErrors] = useState<StudentFormErrors>({})

  const set = <K extends keyof StudentInput>(field: K, value: StudentInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateStudent(values, students.filter((s) => s.id !== student?.id))
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSave({ ...values, fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim() })
  }

  const field = (name: keyof StudentInput, label: string, input: (props: object) => React.ReactNode, hint?: string, span?: 'full') => {
    const error = errors[name]
    return (
      <div className={span ? 'sm:col-span-2' : undefined}>
        <label htmlFor={`student-${name}`} className="text-sm font-medium">{label}</label>
        <div className="mt-1">
          {input({
          id: `student-${name}`,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? `student-${name}-error` : undefined,
          className: `${fieldClass} ${error ? 'border-red-500' : 'border-line'}`,
        })}
        </div>
        {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
        {error && (
          <p id={`student-${name}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">{t(error)}</p>
        )}
      </div>
    )
  }

  const age = values.dateOfBirth && values.dateOfBirth <= todayIso() ? ageFrom(values.dateOfBirth) : null

  const preview = (
    <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-sm">
      <div className="flex justify-center">
        <Avatar name={values.fullName} size="xl" />
      </div>
      <p className="mt-3 truncate font-semibold">{values.fullName.trim() || t('stu.fieldName')}</p>
      <p className="truncate text-xs text-muted">{values.email.trim() || t('stu.fieldEmail')}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
        {[
          isTeacher ? t(values.status === 'active' ? 'usr.active' : 'usr.inactive') : values.teacher,
          age !== null ? t('stu.age', { age: String(age) }) : '',
          values.sex ? t(values.sex === 'male' ? 'stu.sexMale' : 'stu.sexFemale') : '',
        ]
          .filter(Boolean)
          .map((chip) => (
            <span key={chip} className="rounded-md bg-sunken px-2 py-0.5 font-medium">{chip}</span>
          ))}
      </div>
    </div>
  )

  return (
    <FormDialog
      title={student ? t('stu.formEdit') : t('stu.formAdd')}
      description={student ? student.fullName : t('stu.formAddDesc')}
      preview={preview}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6 pt-12 sm:grid-cols-2 md:pt-6">
          {field('fullName', t('stu.fieldName'), (props) => (
            <input {...props} type="text" autoComplete="off" value={values.fullName} onChange={(e) => set('fullName', e.target.value)} />
          ), undefined, 'full')}
          {field('dateOfBirth', t('stu.fieldDob'), (props) => (
            <input {...props} type="date" max={todayIso()} value={values.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          ), age !== null ? `${t('stu.colAge')}: ${age}` : undefined)}
          {field('sex', t('stu.fieldSex'), (props) => (
            <Dropdown
              {...props}
              className="py-2"
              invalid={Boolean(errors.sex)}
              wrapperClassName="block w-full"
              value={values.sex}
              placeholder={t('stu.chooseSex')}
              options={[
                { value: 'male', label: t('stu.sexMale') },
                { value: 'female', label: t('stu.sexFemale') },
              ]}
              onChange={(v) => set('sex', v as Sex)}
            />
          ))}
          {field('email', t('stu.fieldEmail'), (props) => (
            <input {...props} type="email" autoComplete="off" value={values.email} onChange={(e) => set('email', e.target.value)} />
          ))}
          {field('phone', t('stu.fieldPhone'), (props) => (
            <input {...props} type="tel" autoComplete="off" value={values.phone} onChange={(e) => set('phone', e.target.value)} />
          ))}
          {!isTeacher &&
            field('teacher', t('stu.fieldTeacher'), (props) => (
              <Dropdown
                {...props}
                className="py-2"
                invalid={Boolean(errors.teacher)}
                wrapperClassName="block w-full"
                value={values.teacher}
                placeholder={t('stu.chooseTeacher')}
                options={teacherOptions.map((c) => ({ value: c, label: c }))}
                onChange={(v) => set('teacher', v)}
              />
            ), undefined, 'full')}
          {field('status', t('cls.status'), (props) => (
            <Dropdown
              {...props}
              className="py-2"
              wrapperClassName="block w-full"
              value={values.status}
              options={[
                { value: 'active', label: t('usr.active') },
                { value: 'inactive', label: t('usr.inactive') },
              ]}
              onChange={(v) => set('status', v as ActiveStatus)}
            />
          ), undefined, 'full')}
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
