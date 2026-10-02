import Avatar from '@/components/ui/Avatar'
import { EditIcon, TrashIcon } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal'
import type { Teacher } from '@/features/teachers/types'
import { ageFrom, formatDate } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

interface Props {
  teacher: Teacher
  /** How many students this teacher has. */
  studentCount: number
  /** Names of the classes this teacher teaches. */
  classNames: string[]
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

const actionClass =
  'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4'

export default function TeacherDetail({ teacher, studentCount, classNames, onEdit, onDelete, onClose }: Props) {
  const { t, locale } = useI18n()

  return (
    <Modal title={t('tch.details')} onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar name={teacher.fullName} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{teacher.fullName}</p>
            <p className="truncate text-sm text-muted">{teacher.email}</p>
          </div>
        </div>
        <dl className="mt-5 divide-y divide-line rounded-lg border border-line text-sm">
          {[
            [t('tch.subject'), teacher.subject],
            [t('stu.fieldDob'), `${formatDate(teacher.dateOfBirth, locale)} · ${t('stu.age', { age: String(ageFrom(teacher.dateOfBirth)) })}`],
            [t('stu.fieldSex'), t(teacher.sex === 'male' ? 'stu.sexMale' : 'stu.sexFemale')],
            [t('stu.fieldPhone'), teacher.phone],
            [t('tch.classes'), classNames.join(', ') || '—'],
            [t('tch.colStudents'), String(studentCount)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-3 py-2">
              <dt className="text-muted">{label}</dt>
              <dd className="min-w-0 truncate text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex justify-end gap-2 border-t border-line bg-sunken px-5 py-3">
        <button
          type="button"
          onClick={onDelete}
          className={`${actionClass} border border-line bg-surface text-red-600 hover:bg-hover dark:text-red-400`}
        >
          <TrashIcon />
          {t('stu.delete')}
        </button>
        <button type="button" onClick={onEdit} className={`${actionClass} bg-accent-strong text-white hover:brightness-110`}>
          <EditIcon />
          {t('stu.edit')}
        </button>
      </div>
    </Modal>
  )
}
