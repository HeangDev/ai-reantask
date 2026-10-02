import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import DeleteDialog from '@/components/ui/DeleteDialog'
import Dropdown from '@/components/ui/Dropdown'
import { PlusIcon, SearchIcon, TrashIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import { sampleStudents } from '@/features/students/data/sampleStudents'
import TeacherDetail from '@/features/teachers/components/TeacherDetail'
import TeacherForm from '@/features/teachers/components/TeacherForm'
import TeachersTable from '@/features/teachers/components/TeachersTable'
import { useClasses } from '@/features/classes/store/classesStore'
import { useSubjects } from '@/features/subjects/store/subjectsStore'
import { teachersActions, useTeachers } from '@/features/teachers/store/teachersStore'
import type { TeacherInput } from '@/features/teachers/types'
import { useI18n } from '@/lib/i18n'

type Dialog =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'deleteSelected' }
  | { type: 'detail' | 'edit' | 'delete'; id: string }

const NO_DIALOG: Dialog = { type: 'none' }
const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

export default function TeachersPage() {
  const { t } = useI18n()
  const subjects = useSubjects()
  const classes = useClasses()
  const { notify } = useToast()
  const teachers = useTeachers()
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<Dialog>(NO_DIALOG)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teachers.filter(
      (x) => (!subject || x.subject === subject) && `${x.fullName} ${x.email} ${x.phone}`.toLowerCase().includes(q),
    )
  }, [teachers, query, subject])

  // Derived from the students, not stored, so it can never drift out of date.
  const studentCounts = useMemo(
    () =>
      Object.fromEntries(
        teachers.map((x) => [x.id, sampleStudents.filter((s) => s.teacher === x.fullName).length]),
      ),
    [teachers],
  )

  const classNames = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.name])), [classes])

  const target = 'id' in dialog ? teachers.find((x) => x.id === dialog.id) ?? null : null
  const close = () => setDialog(NO_DIALOG)

  const save = (input: TeacherInput) => {
    if (target && dialog.type === 'edit') {
      teachersActions.update(target.id, input)
      notify({ variant: 'info', title: t('tch.updated'), subtitle: t('toast.saved', { name: input.fullName }) })
    } else {
      teachersActions.add(input)
      notify({ title: t('tch.added'), subtitle: t('toast.added', { name: input.fullName }) })
    }
    close()
  }

  const removeIds = (ids: ReadonlySet<string>) => {
    teachersActions.remove(ids)
    setSelected((current) => new Set([...current].filter((id) => !ids.has(id))))
    notify({ variant: 'danger', title: t('tch.deleted'), subtitle: t('toast.removed', { count: String(ids.size) }) })
    close()
  }

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.teachers')}</h1>
          <p className="mt-1 text-sm text-muted">{t('tch.pageDesc')}</p>
        </div>
        <Button
          type="button"
          onClick={() => setDialog({ type: 'create' })}
          size="sm"
          className="flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4"
        >
          <PlusIcon />
          {t('tch.add')}
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          {selected.size > 0 ? (
            <div className="flex flex-1 items-center gap-3 text-sm">
              <span className="font-medium">{t('stu.selected', { count: String(selected.size) })}</span>
              <button
                type="button"
                onClick={() => setDialog({ type: 'deleteSelected' })}
                className={`flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-medium text-red-600 transition-colors hover:bg-hover dark:text-red-400 [&>svg]:h-4 [&>svg]:w-4 ${focusRing}`}
              >
                <TrashIcon />
                {t('stu.deleteSelected')}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className={`rounded px-1 text-muted hover:text-fg hover:underline ${focusRing}`}
              >
                {t('stu.clearSelection')}
              </button>
            </div>
          ) : (
            <>
              <label className="relative flex-1 sm:max-w-xs">
                <span className="sr-only">{t('tch.search')}</span>
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('tch.searchPh')}
                  className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                {t('tch.subject')}
                <Dropdown
                  value={subject}
                  onChange={setSubject}
                  options={[{ value: '', label: t('tch.allSubjects') }, ...subjects.map((s) => ({ value: s.name, label: s.name }))]}
                  wrapperClassName="min-w-0 flex-1 sm:w-48 sm:flex-none"
                />
              </label>
            </>
          )}
        </div>

        {teachers.length === 0 ? (
          <div className="border-t border-line p-10 text-center">
            <p className="font-semibold">{t('tch.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('tch.emptyDesc')}</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="border-t border-line p-10 text-center text-sm text-muted">{t('tch.noMatch')}</p>
        ) : (
          <TeachersTable
            teachers={visible}
            studentCounts={studentCounts}
            classNames={classNames}
            selected={selected}
            onSelectedChange={setSelected}
            onOpen={(id) => setDialog({ type: 'detail', id })}
            onEdit={(id) => setDialog({ type: 'edit', id })}
            onDelete={(id) => setDialog({ type: 'delete', id })}
          />
        )}
      </div>

      {dialog.type === 'create' && <TeacherForm teacher={null} teachers={teachers} onSave={save} onClose={close} />}
      {dialog.type === 'edit' && target && <TeacherForm teacher={target} teachers={teachers} onSave={save} onClose={close} />}
      {dialog.type === 'detail' && target && (
        <TeacherDetail
          teacher={target}
          studentCount={studentCounts[target.id] ?? 0}
          classNames={target.classes.map((id) => classNames[id]).filter(Boolean)}
          onEdit={() => setDialog({ type: 'edit', id: target.id })}
          onDelete={() => setDialog({ type: 'delete', id: target.id })}
          onClose={close}
        />
      )}
      {dialog.type === 'delete' && target && (
        <DeleteDialog
          title={t('tch.deleteTitle')}
          message={t('stu.deleteMessage', { name: target.fullName })}
          confirmLabel={t('stu.delete')}
          person={target}
          onConfirm={() => removeIds(new Set([target.id]))}
          onCancel={close}
        />
      )}
      {dialog.type === 'deleteSelected' && (
        <DeleteDialog
          title={t('tch.deleteManyTitle', { count: String(selected.size) })}
          message={t('tch.deleteManyMessage')}
          confirmLabel={t('stu.delete')}
          onConfirm={() => removeIds(selected)}
          onCancel={close}
        />
      )}
    </section>
  )
}
