import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import Button from '@/components/ui/Button'
import DeleteDialog from '@/components/ui/DeleteDialog'
import Dropdown from '@/components/ui/Dropdown'
import { PlusIcon, SearchIcon } from '@/components/ui/icons'
import SelectionBar from '@/components/ui/SelectionBar'
import { useToast } from '@/components/ui/Toast'
import ViewSwitch from '@/components/ui/ViewSwitch'
import type { ViewMode } from '@/components/ui/ViewSwitch'
import SubjectCard from '@/features/subjects/components/SubjectCard'
import SubjectForm from '@/features/subjects/components/SubjectForm'
import SubjectsTable from '@/features/subjects/components/SubjectsTable'
import { subjectsActions, useSubjects } from '@/features/subjects/store/subjectsStore'
import type { Subject, SubjectInput } from '@/features/subjects/types'
import { useTeachers } from '@/features/teachers/store/teachersStore'
import { useViewMode } from '@/hooks/useViewMode'
import TableEmpty from '@/components/ui/TableEmpty'
import { useI18n } from '@/lib/i18n'

type Dialog = { type: 'none' } | { type: 'create' } | { type: 'deleteSelected' } | { type: 'edit' | 'delete'; id: string }

const NO_DIALOG: Dialog = { type: 'none' }
const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'
// How many cards show at first, and how many more each "Show more" adds.
const PAGE_SIZE = 6

export default function SubjectsPage() {
  const { t } = useI18n()
  const { notify } = useToast()
  const subjects = useSubjects()
  const teachers = useTeachers()
  const [view, setView] = useViewMode('subjects-view')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [dialog, setDialog] = useState<Dialog>(NO_DIALOG)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return subjects.filter(
      (s) => (!status || s.status === status) && `${s.name} ${s.description}`.toLowerCase().includes(q),
    )
  }, [subjects, query, status])

  // Derived from the teachers, not stored, so it can never drift out of date.
  const teacherCounts = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, teachers.filter((x) => x.subject === s.name).length])),
    [subjects, teachers],
  )

  const target = 'id' in dialog ? subjects.find((s) => s.id === dialog.id) ?? null : null
  const close = () => setDialog(NO_DIALOG)
  const resetPaging = () => setLimit(PAGE_SIZE)

  const save = (input: SubjectInput) => {
    if (target && dialog.type === 'edit') {
      subjectsActions.update(target.id, input)
      notify({ variant: 'info', title: t('sub.updated'), subtitle: t('toast.saved', { name: input.name }) })
    } else {
      subjectsActions.add(input)
      notify({ title: t('sub.added'), subtitle: t('toast.added', { name: input.name }) })
    }
    close()
  }

  const toggleStatus = (s: Subject) => {
    const next = s.status === 'active' ? 'inactive' : 'active'
    subjectsActions.update(s.id, { status: next })
    notify({
      variant: 'info',
      title: t('sub.updated'),
      subtitle: t(next === 'active' ? 'cls.nowActive' : 'cls.nowInactive', { name: s.name }),
    })
  }

  const removeIds = (ids: ReadonlySet<string>) => {
    subjectsActions.remove(ids)
    setSelected((current) => new Set([...current].filter((id) => !ids.has(id))))
    notify({ variant: 'danger', title: t('sub.deleted'), subtitle: t('toast.removed', { count: String(ids.size) }) })
    close()
  }

  const chooseView = (next: ViewMode) => {
    setView(next)
    setSelected(new Set())
    resetPaging()
  }

  const filters =
    view === 'table' && selected.size > 0 ? (
      <SelectionBar
        count={selected.size}
        onDelete={() => setDialog({ type: 'deleteSelected' })}
        onClear={() => setSelected(new Set())}
      />
    ) : (
      <>
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">{t('sub.search')}</span>
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              resetPaging()
            }}
            placeholder={t('sub.searchPh')}
            className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          {t('cls.status')}
          <Dropdown
            value={status}
            onChange={(v) => {
              setStatus(v)
              resetPaging()
            }}
            options={[
              { value: '', label: t('sub.allStatuses') },
              { value: 'active', label: t('usr.active') },
              { value: 'inactive', label: t('usr.inactive') },
            ]}
            wrapperClassName="min-w-0 flex-1 sm:w-44 sm:flex-none"
          />
        </label>
      </>
    )

  const emptyState = (
    <>
      <p className="font-semibold">{t('sub.emptyTitle')}</p>
      <p className="mt-1 text-sm text-muted">{t('sub.emptyDesc')}</p>
    </>
  )

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.subjects')}</h1>
          <p className="mt-1 text-sm text-muted">{t('sub.desc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewSwitch view={view} onChange={chooseView} />
          <Button
            type="button"
            onClick={() => setDialog({ type: 'create' })}
            size="sm"
            className="flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4"
          >
            <PlusIcon />
            {t('sub.add')}
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">{filters}</div>
          <SubjectsTable
            emptyMessage={
              subjects.length === 0 ? (
                <TableEmpty title={t('sub.emptyTitle')} description={t('sub.emptyDesc')} />
              ) : (
                <TableEmpty title={t('sub.noMatch')} />
              )
            }
            subjects={visible}
            teacherCounts={teacherCounts}
            selected={selected}
            onSelectedChange={setSelected}
            onOpen={(id) => setDialog({ type: 'edit', id })}
            onEdit={(id) => setDialog({ type: 'edit', id })}
            onDelete={(id) => setDialog({ type: 'delete', id })}
          />
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">{filters}</div>
          {subjects.length === 0 ? (
            <div className="mt-5 rounded-xl border border-line p-10 text-center">{emptyState}</div>
          ) : visible.length === 0 ? (
            <p className="mt-5 rounded-xl border border-line p-10 text-center text-sm text-muted">{t('sub.noMatch')}</p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {visible.slice(0, limit).map((s, index) => (
                  <SubjectCard
                    key={s.id}
                    subject={s}
                    index={index}
                    teacherCount={teacherCounts[s.id] ?? 0}
                    onToggleStatus={() => toggleStatus(s)}
                    onEdit={() => setDialog({ type: 'edit', id: s.id })}
                    onDelete={() => setDialog({ type: 'delete', id: s.id })}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}

          {visible.length > PAGE_SIZE && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <p className="text-xs text-muted">
                {t('notif.showing', { shown: String(Math.min(limit, visible.length)), total: String(visible.length) })}
              </p>
              {limit < visible.length && (
                <button
                  type="button"
                  onClick={() => setLimit((n) => n + PAGE_SIZE)}
                  className={`rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-hover ${focusRing}`}
                >
                  {t('notif.showMore', { count: String(visible.length - limit) })}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {dialog.type === 'create' && <SubjectForm subject={null} subjects={subjects} onSave={save} onClose={close} />}
      {dialog.type === 'edit' && target && <SubjectForm subject={target} subjects={subjects} onSave={save} onClose={close} />}
      {dialog.type === 'delete' && target && (
        <DeleteDialog
          title={t('sub.deleteTitle')}
          message={t('sub.deleteMessage', { name: target.name })}
          confirmLabel={t('stu.delete')}
          person={{ fullName: target.name, email: target.description }}
          onConfirm={() => removeIds(new Set([target.id]))}
          onCancel={close}
        />
      )}
      {dialog.type === 'deleteSelected' && (
        <DeleteDialog
          title={t('sub.deleteManyTitle', { count: String(selected.size) })}
          message={t('sub.deleteManyMessage')}
          confirmLabel={t('stu.delete')}
          onConfirm={() => removeIds(selected)}
          onCancel={close}
        />
      )}
    </section>
  )
}
