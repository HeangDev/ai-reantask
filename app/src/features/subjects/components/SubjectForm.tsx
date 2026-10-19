import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Button } from '@/shared/components/Button'
import { Dropdown } from '@/shared/components/Dropdown'
import { FormDialog } from '@/shared/components/FormDialog'
import { GradientBanner } from '@/shared/components/GradientBanner'
import { SubjectIcon } from '@/shared/components/icons'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { ActiveStatus } from '@/shared/components/StatusBadge'
import { TextAreaField } from '@/shared/components/TextAreaField'
import { TextField } from '@/shared/components/TextField'
import { validateSubject } from '@/features/subjects/lib/validation'
import type { Subject, SubjectFormErrors, SubjectInput } from '@/features/subjects/types'
import { useI18n } from '@/shared/i18n'
import { MAX_DESCRIPTION_LENGTH } from '@/shared/lib/validation'

interface Props {
  /** The subject being edited, or null when creating. */
  subject: Subject | null
  /** Every subject, used to catch duplicate names. */
  subjects: Subject[]
  onSave: (input: SubjectInput) => void
  onClose: () => void
  /** Errors the API reported after submit, such as a name taken by a subject this user cannot see. */
  serverErrors?: SubjectFormErrors
  saving?: boolean
}

export function SubjectForm({ subject, subjects, onSave, onClose, serverErrors, saving = false }: Props) {
  const { t } = useI18n()
  const [values, setValues] = useState<SubjectInput>({
    name: subject?.name ?? '',
    description: subject?.description ?? '',
    status: subject?.status ?? 'active',
  })
  const [errors, setErrors] = useState<SubjectFormErrors>({})

  const set = <K extends keyof SubjectInput>(field: K, value: SubjectInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
    setEdited((prev) => new Set(prev).add(field))
  }

  // A server error shows until the user edits that field again.
  const [edited, setEdited] = useState<ReadonlySet<keyof SubjectInput>>(new Set())
  const [seenServerErrors, setSeenServerErrors] = useState(serverErrors)
  if (seenServerErrors !== serverErrors) {
    setSeenServerErrors(serverErrors)
    setEdited(new Set())
  }
  const fieldError = (field: keyof SubjectInput) => errors[field] ?? (edited.has(field) ? undefined : serverErrors?.[field])

  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    if (saving) return
    const found = validateSubject(values, subjects.filter((x) => x.id !== subject?.id))
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSave({ ...values, name: values.name.trim(), description: values.description.trim() })
  }

  const preview = (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <GradientBanner
        colorKey={subject?.id ?? values.name}
        title={values.name.trim() || t('sub.fieldName')}
        icon={<SubjectIcon />}
      />
      <div className="space-y-2 p-3">
        <p className="line-clamp-2 min-h-10 text-sm text-muted">{values.description.trim() || t('form.description')}</p>
        <StatusBadge status={values.status} />
      </div>
    </div>
  )

  return (
    <FormDialog
      title={subject ? t('sub.formEdit') : t('sub.formAdd')}
      description={subject ? subject.name : t('sub.formAddDesc')}
      preview={preview}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6 pt-12 md:pt-6">
          <TextField
            label={t('sub.fieldName')}
            autoComplete="off"
            value={values.name}
            onChange={(v) => set('name', v)}
            error={fieldError('name')}
          />

          <TextAreaField
            label={t('form.description')}
            value={values.description}
            onChange={(v) => set('description', v)}
            error={fieldError('description')}
            maxLength={MAX_DESCRIPTION_LENGTH}
          />

          <div>
            <label htmlFor="subject-status" className="text-sm font-medium">{t('cls.status')}</label>
            <div className="mt-1">
              <Dropdown
                id="subject-status"
                className="py-2"
                wrapperClassName="block w-full"
                value={values.status}
                options={[
                  { value: 'active', label: t('usr.active') },
                  { value: 'inactive', label: t('usr.inactive') },
                ]}
                onChange={(v) => set('status', v as ActiveStatus)}
              />
            </div>
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
          <Button type="submit" disabled={saving}>
            {t('stu.save')}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}
