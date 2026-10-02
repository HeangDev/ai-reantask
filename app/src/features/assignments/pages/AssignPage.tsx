import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import DeleteDialog from '@/components/ui/DeleteDialog'
import Dropdown from '@/components/ui/Dropdown'
import { PlusIcon, SearchIcon, TrashIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import AssignForm from '@/features/assignments/components/AssignForm'
import AssignTable from '@/features/assignments/components/AssignTable'
import { useAssignableClassNames } from '@/features/classes/hooks/useAssignableClassNames'
import { useClassNameScope } from '@/features/classes/hooks/useVisibleClasses'
import type { AssignFormValues } from '@/features/assignments/lib/assignValidation'
import { planRepository } from '@/features/assignments/lib/repoNames'
import { setUpRepository } from '@/features/assignments/services/setUpRepository'
import { assignmentsActions, useAssignments } from '@/features/assignments/store/assignmentsStore'
import type { Assignment, AssignmentTask } from '@/features/assignments/types'
import TableEmpty from '@/components/ui/TableEmpty'
import { useI18n } from '@/lib/i18n'

type Dialog =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'deleteSelected' }
  | { type: 'edit' | 'delete'; id: string }

const NO_DIALOG: Dialog = { type: 'none' }
const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

/** Turns the form into the fields an assignment stores. Tasks keep the teacher's verdict if their title is unchanged. */
function fromForm(values: AssignFormValues, previous?: Assignment) {
  const tasks: AssignmentTask[] = values.tasks
    .map((title) => title.trim())
    .filter(Boolean)
    .map((title) => {
      const existing = previous?.tasks?.find((task) => task.title === title)
      return existing ?? { id: crypto.randomUUID(), title }
    })

  return {
    title: values.title.trim(),
    className: values.className,
    description: values.description.trim(),
    deadline: values.deadline,
    phase: values.phase,
    maxScore: Number(values.maxScore),
    maxFileSizeMb: Number(values.maxFileSizeMb),
    allowedFileTypes: values.fileTypes,
    assignees: values.assignees,
    tasks,
  }
}

/** The teacher's side: create assignments and choose which students receive them. */
export default function AssignPage() {
  const { t } = useI18n()
  const { notify } = useToast()
  const everyAssignment = useAssignments()
  const scope = useClassNameScope()
  const classOptions = useAssignableClassNames()
  // A teacher only sees the assignments of the classes they teach.
  const assignments = useMemo(() => (scope ? everyAssignment.filter((a) => scope.has(a.className)) : everyAssignment), [everyAssignment, scope])
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [className, setClassName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<Dialog>(NO_DIALOG)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assignments.filter(
      (a) => (!className || a.className === className) && `${a.title} ${a.className}`.toLowerCase().includes(q),
    )
  }, [assignments, query, className])

  const target = 'id' in dialog ? assignments.find((a) => a.id === dialog.id) ?? null : null
  const close = () => setDialog(NO_DIALOG)

  const save = (values: AssignFormValues) => {
    if (target && dialog.type === 'edit') {
      const fields = fromForm(values, target)
      assignmentsActions.update(target.id, fields)
      // Students added to the assignment get their own branch; existing branches are left alone.
      if (target.repo) void setUpRepository(target.id, planRepository(fields.className, fields.title, fields.assignees, target.repo))
      notify({ variant: 'info', title: t('asg.updated'), subtitle: t('toast.saved', { name: fields.title }) })
    } else {
      const id = crypto.randomUUID()
      const fields = fromForm(values)
      assignmentsActions.add({ id, status: 'pending', ...fields })
      const plan = planRepository(fields.className, fields.title, fields.assignees)
      void setUpRepository(id, plan)
      notify({ title: t('asg.added'), subtitle: t('asg.repoSetup', { name: plan.name, count: String(plan.branches.length) }) })
    }
    close()
  }

  const removeIds = (ids: ReadonlySet<string>) => {
    assignmentsActions.remove(ids)
    setSelected((current) => new Set([...current].filter((id) => !ids.has(id))))
    notify({ variant: 'danger', title: t('asg.deleted'), subtitle: t('toast.removed', { count: String(ids.size) }) })
    close()
  }

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.assign')}</h1>
          <p className="mt-1 text-sm text-muted">{t('asg.pageDesc')}</p>
        </div>
        <Button
          type="button"
          onClick={() => setDialog({ type: 'create' })}
          size="sm"
          className="flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4"
        >
          <PlusIcon />
          {t('asg.add')}
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
                <span className="sr-only">{t('asg.search')}</span>
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('asg.searchPh')}
                  className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                {t('board.class')}
                <Dropdown
                  value={className}
                  onChange={setClassName}
                  options={[{ value: '', label: t('board.allClasses') }, ...classOptions.map((c) => ({ value: c, label: c }))]}
                  wrapperClassName="min-w-0 flex-1 sm:w-48 sm:flex-none"
                />
              </label>
            </>
          )}
        </div>

        <AssignTable
          emptyMessage={
            assignments.length === 0 ? (
              <TableEmpty title={t('asg.emptyTitle')} description={t('asg.emptyDesc')} />
            ) : (
              <TableEmpty title={t('asg.noMatch')} />
            )
          }
          assignments={visible}
          selected={selected}
          onSelectedChange={setSelected}
          onOpen={(id) => navigate(`/assign/${id}`)}
          onEdit={(id) => setDialog({ type: 'edit', id })}
          onDelete={(id) => setDialog({ type: 'delete', id })}
        />
      </div>

      {dialog.type === 'create' && <AssignForm assignment={null} onSave={save} onClose={close} />}
      {dialog.type === 'edit' && target && <AssignForm assignment={target} onSave={save} onClose={close} />}
      {dialog.type === 'delete' && target && (
        <DeleteDialog
          title={t('asg.deleteTitle')}
          message={t('asg.deleteMessage', { name: target.title })}
          confirmLabel={t('stu.delete')}
          onConfirm={() => removeIds(new Set([target.id]))}
          onCancel={close}
        />
      )}
      {dialog.type === 'deleteSelected' && (
        <DeleteDialog
          title={t('asg.deleteManyTitle', { count: String(selected.size) })}
          message={t('asg.deleteManyMessage')}
          confirmLabel={t('stu.delete')}
          onConfirm={() => removeIds(selected)}
          onCancel={close}
        />
      )}
    </section>
  )
}
