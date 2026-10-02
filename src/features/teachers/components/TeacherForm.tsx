import { useState } from 'react'
import type { FormEvent } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import FormDialog from '@/components/ui/FormDialog'
import MultiSelect from '@/components/ui/MultiSelect'
import { pickableClasses, useClasses } from '@/features/classes/store/classesStore'
import { pickableSubjectNames, useSubjects } from '@/features/subjects/store/subjectsStore'
import { validateTeacher } from '@/features/teachers/lib/validation'
import type { Teacher, TeacherFormErrors, TeacherInput } from '@/features/teachers/types'
import type { Sex } from '@/features/students/types'
import { ageFrom, todayIso } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** The teacher being edited, or null when creating. */
  teacher: Teacher | null
  /** Every teacher, used to catch duplicate emails. */
  teachers: Teacher[]
  onSave: (input: TeacherInput) => void
  onClose: () => void
}

const fieldClass =
  'w-full rounded-lg border bg-sunken px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent'

export default function TeacherForm({ teacher, teachers, onSave, onClose }: Props) {
  const { t } = useI18n()
  const subjects = useSubjects()
  const classes = useClasses()
  const [values, setValues] = useState<TeacherInput>({
    fullName: teacher?.fullName ?? '',
    email: teacher?.email ?? '',
    phone: teacher?.phone ?? '',
    // Empty until chosen; validation rejects it before it can be saved.
    sex: teacher?.sex ?? ('' as Sex),
    dateOfBirth: teacher?.dateOfBirth ?? '',
    subject: teacher?.subject ?? '',
    classes: teacher?.classes ?? [],
  })
  const [errors, setErrors] = useState<TeacherFormErrors>({})

  const set = <K extends keyof TeacherInput>(field: K, value: TeacherInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateTeacher(values, teachers.filter((x) => x.id !== teacher?.id))
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSave({ ...values, fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim() })
  }

  const field = (
    name: keyof TeacherInput,
    label: string,
    input: (props: object) => React.ReactNode,
    hint?: string,
    span?: 'full',
  ) => {
    const error = errors[name]
    return (
      <div className={span ? 'sm:col-span-2' : undefined}>
        <label htmlFor={`teacher-${name}`} className="text-sm font-medium">{label}</label>
        <div className="mt-1">
          {input({
            id: `teacher-${name}`,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error ? `teacher-${name}-error` : undefined,
            className: `${fieldClass} ${error ? 'border-red-500' : 'border-line'}`,
          })}
        </div>
        {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
        {error && (
          <p id={`teacher-${name}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">{t(error)}</p>
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
          values.subject,
          age !== null ? t('stu.age', { age: String(age) }) : '',
          values.classes.length > 0 ? t('tch.classesCount', { count: String(values.classes.length) }) : '',
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
      title={teacher ? t('tch.formEdit') : t('tch.formAdd')}
      description={teacher ? teacher.fullName : t('tch.formAddDesc')}
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
          {field('subject', t('tch.subject'), (props) => (
            <Dropdown
              {...props}
              className="py-2"
              invalid={Boolean(errors.subject)}
              wrapperClassName="block w-full"
              value={values.subject}
              placeholder={t('tch.chooseSubject')}
              options={pickableSubjectNames(subjects, teacher?.subject).map((s) => ({ value: s, label: s }))}
              onChange={(v) => set('subject', v)}
            />
          ), undefined, 'full')}
          <div className="sm:col-span-2">
            <MultiSelect
              label={t('tch.classes')}
              placeholder={t('tch.addClass')}
              emptyText={t('tch.noClasses')}
              removeLabel={(name) => t('tch.removeClass', { name })}
              options={pickableClasses(classes, teacher?.classes).map((c) => ({ value: c.id, label: c.name }))}
              value={values.classes}
              onChange={(v) => set('classes', v)}
            />
          </div>
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
