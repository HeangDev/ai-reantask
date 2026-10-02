import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import MultiSelect from '@/components/ui/MultiSelect'
import { useToast } from '@/components/ui/Toast'
import { joinRequestsActions, membersOfClass, useJoinRequests } from '@/features/classes/store/joinRequestsStore'
import type { SchoolClass } from '@/features/classes/types'
import { sampleStudents } from '@/features/students/data/sampleStudents'
import { useI18n } from '@/lib/i18n'

interface Props {
  schoolClass: SchoolClass
  onClose: () => void
}

/** The teacher puts students straight into a class, without waiting for them to use the class code. */
export default function AddStudentsDialog({ schoolClass, onClose }: Props) {
  const { t } = useI18n()
  const { notify } = useToast()
  const requests = useJoinRequests()
  const [chosen, setChosen] = useState<string[]>([])

  const members = membersOfClass(requests, schoolClass.id)
  const memberIds = new Set(members.map((m) => m.studentId))
  const available = sampleStudents.filter((s) => !memberIds.has(s.id))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const students = available.filter((s) => chosen.includes(s.id)).map((s) => ({ id: s.id, name: s.fullName }))
    if (students.length === 0) return
    joinRequestsActions.addMembers(schoolClass.id, students)
    notify({
      title: t('cls.studentsAdded'),
      subtitle: t('cls.studentsAddedDesc', { count: String(students.length), name: schoolClass.name }),
    })
    onClose()
  }

  return (
    <Modal title={t('cls.studentsTitle', { name: schoolClass.name })} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-5 p-5">
        <div>
          <p className="text-sm font-medium">
            {t('cls.inClass')} <span className="text-muted">({members.length})</span>
          </p>
          {members.length === 0 ? (
            <p className="mt-1 text-sm text-muted">{t('cls.noMembers')}</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {members.map((m) => (
                <li key={m.studentId} className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium">
                  {m.student}
                </li>
              ))}
            </ul>
          )}
        </div>

        <MultiSelect
          label={t('cls.addStudents')}
          placeholder={t('cls.pickStudent')}
          emptyText={t('cls.noStudentsLeft')}
          removeLabel={(name) => t('cls.removeStudent', { name })}
          options={available.map((s) => ({ value: s.id, label: s.fullName }))}
          value={chosen}
          onChange={setChosen}
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('dialog.cancel')}
          </button>
          <Button type="submit" disabled={chosen.length === 0}>
            {t('cls.addToClass')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
