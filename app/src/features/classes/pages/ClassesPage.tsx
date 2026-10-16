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
import ClassCard from '@/features/classes/components/ClassCard'
import ClassForm from '@/features/classes/components/ClassForm'
import ClassesTable from '@/features/classes/components/ClassesTable'
import JoinRequestsPanel from '@/features/classes/components/JoinRequestsPanel'
import { useClassesQuery, useCreateClass, useDeleteClasses, useUpdateClass } from '@/features/classes/hooks/useClasses'
import type { ClassFormErrors, ClassInput, SchoolClass } from '@/features/classes/types'
import { teachersActions } from '@/features/teachers/store/teachersStore'
import { useCurrentTeacher } from '@/features/teachers/hooks/useCurrentTeacher'
import { useViewMode } from '@/hooks/useViewMode'
import { ApiError } from '@/lib/apiClient'
import TableEmpty from '@/components/ui/TableEmpty'
import { useI18n } from '@/lib/i18n'

type Dialog =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'deleteSelected' }
  | { type: 'edit' | 'delete'; id: string }

const NO_DIALOG: Dialog = { type: 'none' }
const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'
// How many cards show at first, and how many more each "Show more" adds.
const PAGE_SIZE = 6

export default function ClassesPage() {
  const { t } = useI18n()
  const { notify } = useToast()
  // The API only returns the classes this person may see.
  const classesQuery = useClassesQuery()
  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data])
  const currentTeacher = useCurrentTeacher()
  const createClass = useCreateClass()
  const updateClass = useUpdateClass()
  const deleteClasses = useDeleteClasses()
  const saving = createClass.isPending || updateClass.isPending
  const [serverErrors, setServerErrors] = useState<ClassFormErrors>({})
  const [view, setView] = useViewMode('classes-view')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [dialog, setDialog] = useState<Dialog>(NO_DIALOG)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return classes.filter(
      (c) => (!status || c.status === status) && `${c.name} ${c.description}`.toLowerCase().includes(q),
    )
  }, [classes, query, status])

  const target = 'id' in dialog ? classes.find((c) => c.id === dialog.id) ?? null : null
  const close = () => {
    setDialog(NO_DIALOG)
    setServerErrors({})
  }
  const resetPaging = () => setLimit(PAGE_SIZE)

  const showSaveError = (error: unknown) => {
    const fields = error instanceof ApiError && error.status === 422 ? error.fieldErrors : {}
    const found: ClassFormErrors = {}
    if (fields.name) found.name = 'cls.errNameTaken'
    if (fields.start_at) found.startDate = 'cls.errStartDate'
    if (fields.end_date) found.endDate = 'cls.errEndDate'
    if (Object.keys(found).length > 0) setServerErrors(found)
    else notify({ variant: 'danger', title: t('cls.saveFailed'), subtitle: t('usr.tryAgain') })
  }

  const save = (input: ClassInput) => {
    if (saving) return
    if (target && dialog.type === 'edit') {
      updateClass.mutate(
        { id: target.id, changes: input },
        {
          onSuccess: () => {
            notify({ variant: 'info', title: t('cls.updated'), subtitle: t('toast.saved', { name: input.name }) })
            close()
          },
          onError: showSaveError,
        },
      )
    } else {
      createClass.mutate(input, {
        onSuccess: (created) => {
          // A class a teacher creates is theirs to teach.
          if (currentTeacher) teachersActions.update(currentTeacher.id, { classes: [...currentTeacher.classes, created.id] })
          notify({ title: t('cls.added'), subtitle: t('toast.added', { name: input.name }) })
          close()
        },
        onError: showSaveError,
      })
    }
  }

  const toggleStatus = (c: SchoolClass) => {
    if (saving) return
    const next = c.status === 'active' ? 'inactive' : 'active'
    updateClass.mutate(
      { id: c.id, changes: { status: next } },
      {
        onSuccess: () =>
          notify({
            variant: 'info',
            title: t('cls.updated'),
            subtitle: t(next === 'active' ? 'cls.nowActive' : 'cls.nowInactive', { name: c.name }),
          }),
        onError: () => notify({ variant: 'danger', title: t('cls.saveFailed'), subtitle: t('usr.tryAgain') }),
      },
    )
  }

  const removeIds = (ids: ReadonlySet<string>) => {
    if (deleteClasses.isPending) return
    deleteClasses.mutate([...ids], {
      onSuccess: () => {
        setSelected((current) => new Set([...current].filter((id) => !ids.has(id))))
        notify({ variant: 'danger', title: t('cls.deleted'), subtitle: t('toast.removed', { count: String(ids.size) }) })
      },
      onError: () => notify({ variant: 'danger', title: t('cls.deleteFailed'), subtitle: t('usr.tryAgain') }),
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
          <span className="sr-only">{t('cls.search')}</span>
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
            placeholder={t('cls.searchPh')}
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

  const loadError = classesQuery.isError && (
    <div role="alert" className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {t('cls.loadFailed')}
      <button
        type="button"
        onClick={() => void classesQuery.refetch()}
        className={`rounded-lg border border-line px-3 py-1 text-xs font-medium text-fg hover:bg-hover ${focusRing}`}
      >
        {t('usr.tryAgain')}
      </button>
    </div>
  )

  const emptyState = (
    <>
      <p className="font-semibold">{t('cls.emptyTitle')}</p>
      <p className="mt-1 text-sm text-muted">{t('cls.emptyDesc')}</p>
    </>
  )

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.classes')}</h1>
          <p className="mt-1 text-sm text-muted">{t('cls.desc')}</p>
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
            {t('cls.add')}
          </Button>
        </div>
      </div>

      <JoinRequestsPanel />

      {view === 'table' ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">{filters}</div>
          {loadError}
          <ClassesTable
            emptyMessage={
              classesQuery.isPending ? (
                <TableEmpty title={t('cls.loading')} />
              ) : classes.length === 0 ? (
                <TableEmpty title={t('cls.emptyTitle')} description={t('cls.emptyDesc')} />
              ) : (
                <TableEmpty title={t('cls.noMatch')} />
              )
            }
            classes={visible}
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
          {classesQuery.isPending ? (
            <p className="mt-5 rounded-xl border border-line p-10 text-center text-sm text-muted">{t('cls.loading')}</p>
          ) : classes.length === 0 ? (
            <div className="mt-5 rounded-xl border border-line p-10 text-center">{emptyState}</div>
          ) : visible.length === 0 ? (
            <p className="mt-5 rounded-xl border border-line p-10 text-center text-sm text-muted">{t('cls.noMatch')}</p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {visible.slice(0, limit).map((c, index) => (
                  <ClassCard
                    key={c.id}
                    schoolClass={c}
                    index={index}
                    onToggleStatus={() => toggleStatus(c)}
                    onEdit={() => setDialog({ type: 'edit', id: c.id })}
                    onDelete={() => setDialog({ type: 'delete', id: c.id })}
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
        <ClassForm schoolClass={null} classes={classes} onSave={save} onClose={close} serverErrors={serverErrors} saving={saving} />
      )}
      {dialog.type === 'edit' && target && (
        <ClassForm schoolClass={target} classes={classes} onSave={save} onClose={close} serverErrors={serverErrors} saving={saving} />
      )}
      {dialog.type === 'delete' && target && (
        <DeleteDialog
          title={t('cls.deleteTitle')}
          message={t('cls.deleteMessage', { name: target.name })}
          confirmLabel={t('stu.delete')}
          person={{ fullName: target.name, email: target.description }}
          onConfirm={() => removeIds(new Set([target.id]))}
          onCancel={close}
        />
      )}
      {dialog.type === 'deleteSelected' && (
        <DeleteDialog
          title={t('cls.deleteManyTitle', { count: String(selected.size) })}
          message={t('cls.deleteManyMessage')}
          confirmLabel={t('stu.delete')}
          onConfirm={() => removeIds(selected)}
          onCancel={close}
        />
      )}
    </section>
  )
}
