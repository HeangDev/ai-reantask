import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Button } from '@/shared/components/Button'
import { DeleteDialog } from '@/shared/components/DeleteDialog'
import { Dropdown } from '@/shared/components/Dropdown'
import { PlusIcon, SearchIcon } from '@/shared/components/icons'
import { SelectionBar } from '@/shared/components/SelectionBar'
import { useToast } from '@/shared/components/Toast'
import { ViewSwitch } from '@/shared/components/ViewSwitch'
import type { ViewMode } from '@/shared/components/ViewSwitch'
import { SubjectCard } from '@/features/subjects/components/SubjectCard'
import { SubjectForm } from '@/features/subjects/components/SubjectForm'
import { SubjectsTable } from '@/features/subjects/components/SubjectsTable'
import { useCreateSubject, useDeleteSubjects, useSubjectsQuery, useUpdateSubject } from '@/features/subjects/api/useSubjects'
import type { Subject, SubjectFormErrors, SubjectInput } from '@/features/subjects/types'
import { useViewMode } from '@/shared/hooks/useViewMode'
import { ApiError } from '@/shared/api/http'
import { TableEmpty } from '@/shared/components/TableEmpty'
import { useI18n } from '@/shared/i18n'

type Dialog = { type: 'none' } | { type: 'create' } | { type: 'deleteSelected' } | { type: 'edit' | 'delete'; id: string }

const NO_DIALOG: Dialog = { type: 'none' }
const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'
// How many cards show at first, and how many more each "Show more" adds.
const PAGE_SIZE = 6

export function SubjectsPage() {
  const { t } = useI18n()
  const { notify } = useToast()
  const subjectsQuery = useSubjectsQuery()
  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data])
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const deleteSubjects = useDeleteSubjects()
  const saving = createSubject.isPending || updateSubject.isPending
  const [serverErrors, setServerErrors] = useState<SubjectFormErrors>({})
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

  const target = 'id' in dialog ? subjects.find((s) => s.id === dialog.id) ?? null : null
  const close = () => {
    setDialog(NO_DIALOG)
    setServerErrors({})
  }
  const resetPaging = () => setLimit(PAGE_SIZE)

  const showSaveError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 422 && error.fieldErrors.name) setServerErrors({ name: 'sub.errNameTaken' })
    else notify({ variant: 'danger', title: t('sub.saveFailed'), subtitle: t('usr.tryAgain') })
  }

  const save = (input: SubjectInput) => {
    if (saving) return
    if (target && dialog.type === 'edit') {
      updateSubject.mutate(
        { id: target.id, changes: input },
        {
          onSuccess: () => {
            notify({ variant: 'info', title: t('sub.updated'), subtitle: t('toast.saved', { name: input.name }) })
            close()
          },
          onError: showSaveError,
        },
      )
    } else {
      createSubject.mutate(input, {
        onSuccess: () => {
          notify({ title: t('sub.added'), subtitle: t('toast.added', { name: input.name }) })
          close()
        },
        onError: showSaveError,
      })
    }
  }

  const toggleStatus = (s: Subject) => {
    if (saving) return
    const next = s.status === 'active' ? 'inactive' : 'active'
    updateSubject.mutate(
      { id: s.id, changes: { status: next } },
      {
        onSuccess: () =>
          notify({
            variant: 'info',
            title: t('sub.updated'),
            subtitle: t(next === 'active' ? 'cls.nowActive' : 'cls.nowInactive', { name: s.name }),
          }),
        onError: () => notify({ variant: 'danger', title: t('sub.saveFailed'), subtitle: t('usr.tryAgain') }),
      },
    )
  }

  const removeIds = (ids: ReadonlySet<string>) => {
    if (deleteSubjects.isPending) return
    deleteSubjects.mutate([...ids], {
      onSuccess: () => {
        setSelected((current) => new Set([...current].filter((id) => !ids.has(id))))
        notify({ variant: 'danger', title: t('sub.deleted'), subtitle: t('toast.removed', { count: String(ids.size) }) })
      },
      onError: () => notify({ variant: 'danger', title: t('sub.deleteFailed'), subtitle: t('usr.tryAgain') }),
      onSettled: close,
    })
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

  const loadError = subjectsQuery.isError && (
    <div role="alert" className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {t('sub.loadFailed')}
      <button
        type="button"
        onClick={() => void subjectsQuery.refetch()}
        className={`rounded-lg border border-line px-3 py-1 text-xs font-medium text-fg hover:bg-hover ${focusRing}`}
      >
        {t('usr.tryAgain')}
      </button>
    </div>
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
          {loadError}
          <SubjectsTable
            emptyMessage={
              subjectsQuery.isPending ? (
                <TableEmpty title={t('sub.loading')} />
              ) : subjects.length === 0 ? (
                <TableEmpty title={t('sub.emptyTitle')} description={t('sub.emptyDesc')} />
              ) : (
                <TableEmpty title={t('sub.noMatch')} />
              )
            }
            subjects={visible}
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
          {loadError}
          {subjectsQuery.isPending ? (
            <p className="mt-5 rounded-xl border border-line p-10 text-center text-sm text-muted">{t('sub.loading')}</p>
          ) : subjects.length === 0 ? (
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

      {dialog.type === 'create' && (
        <SubjectForm subject={null} subjects={subjects} onSave={save} onClose={close} serverErrors={serverErrors} saving={saving} />
      )}
      {dialog.type === 'edit' && target && (
        <SubjectForm subject={target} subjects={subjects} onSave={save} onClose={close} serverErrors={serverErrors} saving={saving} />
      )}
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
