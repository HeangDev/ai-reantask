import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import { sampleStudents } from '@/features/students/data/sampleStudents'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** Full name of the classmate; matched against the student directory. */
  name: string
  onClose: () => void
}

/**
 * Read-only profile of a classmate, for a student looking at who they work with.
 * It shows how to reach and place them, not private details such as date of birth or phone.
 */
export default function StudentProfile({ name, onClose }: Props) {
  const { t } = useI18n()
  const student = sampleStudents.find((s) => s.fullName === name)

  return (
    <Modal title={t('profile.title')} onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{name}</p>
          </div>
        </div>

        {student ? (
          <dl className="mt-5 divide-y divide-line rounded-lg border border-line text-sm">
            <div className="flex justify-between gap-4 px-3 py-2">
              <dt className="text-muted">{t('stu.fieldEmail')}</dt>
              <dd className="min-w-0 truncate font-medium">{student.email}</dd>
            </div>
            <div className="flex justify-between gap-4 px-3 py-2">
              <dt className="text-muted">{t('stu.fieldTeacher')}</dt>
              <dd className="min-w-0 truncate font-medium">{student.teacher}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-5 text-sm text-muted">{t('profile.unavailable')}</p>
        )}
      </div>
    </Modal>
  )
}
