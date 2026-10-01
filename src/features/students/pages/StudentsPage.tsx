import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import { PlusIcon, SearchIcon, TrashIcon } from '@/components/ui/icons'
import Dropdown from '@/components/ui/Dropdown'
import DeleteDialog from '@/components/ui/DeleteDialog'
import StudentDetail from '@/features/students/components/StudentDetail'
import StudentForm from '@/features/students/components/StudentForm'
import StudentsTable from '@/features/students/components/StudentsTable'
import { sampleStudents, studentTeachers } from '@/features/students/data/sampleStudents'
import type { Student, StudentInput } from '@/features/students/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

type Dialog =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'deleteSelected' }
  | { type: 'detail' | 'edit' | 'delete'; id: string }

const NO_DIALOG: Dialog = { type: 'none' }
const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

export default function StudentsPage() {
  const { t } = useI18n()
  const [students, setStudents] = useState<Student[]>(sampleStudents)
  const [query, setQuery] = useState('')
  const [teacher, setTeacher] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<Dialog>(NO_DIALOG)
  const [notice, setNotice] = useState<TranslationKey | null>(null)

  // Success feedback disappears on its own.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter(
      (s) => (!teacher || s.teacher === teacher) && `${s.fullName} ${s.email} ${s.phone}`.toLowerCase().includes(q),
    )
  }, [students, query, teacher])

  const target = 'id' in dialog ? students.find((s) => s.id === dialog.id) ?? null : null
  const close = () => setDialog(NO_DIALOG)

  const save = (input: StudentInput) => {
    if (target && dialog.type === 'edit') {
      setStudents((list) => list.map((s) => (s.id === target.id ? { ...s, ...input } : s)))
      setNotice('stu.updated')
    } else {
      setStudents((list) => [...list, { id: crypto.randomUUID(), ...input }])
      setNotice('stu.added')
    }
    close()
  }

  const removeIds = (ids: ReadonlySet<string>) => {
    setStudents((list) => list.filter((s) => !ids.has(s.id)))
    setSelected((current) => new Set([...current].filter((id) => !ids.has(id))))
    setNotice('stu.deleted')
    close()
  }

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('nav.students')}</h1>
        <Button
          type="button"
          onClick={() => setDialog({ type: 'create' })}
          size="sm"
          className="flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4"
        >
          <PlusIcon />
          {t('stu.add')}
        </Button>
      </div>

      <div role="status" aria-live="polite" className="mt-3 empty:hidden">
        {notice && (
          <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {t(notice)}
          </p>
        )}
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
                <span className="sr-only">{t('stu.search')}</span>
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('stu.searchPh')}
                  className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                {t('stu.teacher')}
                <Dropdown
                  value={teacher}
                  onChange={setTeacher}
                  options={[{ value: '', label: t('stu.allTeachers') }, ...studentTeachers.map((c) => ({ value: c, label: c }))]}
                  wrapperClassName="min-w-0 flex-1 sm:w-48 sm:flex-none"
                />
              </label>
            </>
          )}
        </div>

        {students.length === 0 ? (
          <div className="border-t border-line p-10 text-center">
            <p className="font-semibold">{t('stu.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('stu.emptyDesc')}</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="border-t border-line p-10 text-center text-sm text-muted">{t('stu.noMatch')}</p>
        ) : (
          <StudentsTable
            students={visible}
            selected={selected}
            onSelectedChange={setSelected}
            onOpen={(id) => setDialog({ type: 'detail', id })}
            onEdit={(id) => setDialog({ type: 'edit', id })}
            onDelete={(id) => setDialog({ type: 'delete', id })}
          />
        )}
      </div>

      {dialog.type === 'create' && <StudentForm student={null} students={students} onSave={save} onClose={close} />}
      {dialog.type === 'edit' && target && <StudentForm student={target} students={students} onSave={save} onClose={close} />}
      {dialog.type === 'detail' && target && (
        <StudentDetail
          student={target}
          onEdit={() => setDialog({ type: 'edit', id: target.id })}
          onDelete={() => setDialog({ type: 'delete', id: target.id })}
          onClose={close}
        />
      )}
      {dialog.type === 'delete' && target && (
        <DeleteDialog
          title={t('stu.deleteTitle')}
          message={t('stu.deleteMessage', { name: target.fullName })}
          confirmLabel={t('stu.delete')}
          person={target}
          onConfirm={() => removeIds(new Set([target.id]))}
          onCancel={close}
        />
      )}
      {dialog.type === 'deleteSelected' && (
        <DeleteDialog
          title={t('stu.deleteManyTitle', { count: String(selected.size) })}
          message={t('stu.deleteManyMessage')}
          confirmLabel={t('stu.delete')}
          onConfirm={() => removeIds(selected)}
          onCancel={close}
        />
      )}
    </section>
  )
}
