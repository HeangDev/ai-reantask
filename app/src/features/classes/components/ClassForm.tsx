import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import FormDialog from '@/components/ui/FormDialog'
import GradientBanner from '@/components/ui/GradientBanner'
import { ClassIcon } from '@/components/ui/icons'
import StatusBadge from '@/components/ui/StatusBadge'
import TextAreaField from '@/components/ui/TextAreaField'
import TextField from '@/components/ui/TextField'
import { validateClass } from '@/features/classes/lib/validation'
import type { ClassFormErrors, ClassInput, ClassStatus, SchoolClass } from '@/features/classes/types'
import { useI18n } from '@/lib/i18n'
import { MAX_DESCRIPTION_LENGTH } from '@/lib/validation'

interface Props {
  /** The class being edited, or null when creating. */
  schoolClass: SchoolClass | null
  /** Every class, used to catch duplicate names. */
  classes: SchoolClass[]
  onSave: (input: ClassInput) => void
  onClose: () => void
}

export default function ClassForm({ schoolClass, classes, onSave, onClose }: Props) {
  const { t } = useI18n()
  const [values, setValues] = useState<ClassInput>({
    name: schoolClass?.name ?? '',
    description: schoolClass?.description ?? '',
    startDate: schoolClass?.startDate ?? '',
    endDate: schoolClass?.endDate ?? '',
    status: schoolClass?.status ?? 'active',
  })
  const [errors, setErrors] = useState<ClassFormErrors>({})

  const set = <K extends keyof ClassInput>(field: K, value: ClassInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateClass(values, classes.filter((x) => x.id !== schoolClass?.id))
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSave({ ...values, name: values.name.trim(), description: values.description.trim() })
  }

  const preview = (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <GradientBanner
        colorKey={schoolClass?.id ?? values.name}
        title={values.name.trim() || t('cls.fieldName')}
        icon={<ClassIcon />}
      />
      <div className="space-y-2 p-3">
        <p className="line-clamp-2 min-h-10 text-sm text-muted">{values.description.trim() || t('form.description')}</p>
        <StatusBadge status={values.status} />
      </div>
    </div>
  )

  return (
    <FormDialog
      title={schoolClass ? t('cls.formEdit') : t('cls.formAdd')}
      description={schoolClass ? schoolClass.name : t('cls.formAddDesc')}
      preview={preview}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6 pt-12 md:pt-6">
          <TextField
            label={t('cls.fieldName')}
            autoComplete="off"
            value={values.name}
            onChange={(v) => set('name', v)}
            error={errors.name}
          />
          <TextAreaField
            label={t('form.description')}
            value={values.description}
            onChange={(v) => set('description', v)}
            error={errors.description}
            maxLength={MAX_DESCRIPTION_LENGTH}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t('cls.startDate')}
              type="date"
              value={values.startDate}
              onChange={(v) => set('startDate', v)}
              error={errors.startDate}
            />
            <TextField
              label={t('cls.endDate')}
              type="date"
              min={values.startDate || undefined}
              value={values.endDate}
              onChange={(v) => set('endDate', v)}
              error={errors.endDate}
            />
          </div>
          <div>
            <label htmlFor="class-status" className="text-sm font-medium">{t('cls.status')}</label>
            <div className="mt-1">
              <Dropdown
                id="class-status"
                className="py-2"
                wrapperClassName="block w-full"
                value={values.status}
                options={[
                  { value: 'active', label: t('usr.active') },
                  { value: 'inactive', label: t('usr.inactive') },
                ]}
                onChange={(v) => set('status', v as ClassStatus)}
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
          <Button type="submit">{t('stu.save')}</Button>
        </div>
      </form>
    </FormDialog>
  )
}
