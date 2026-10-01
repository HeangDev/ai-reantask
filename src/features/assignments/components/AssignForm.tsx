import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import { CloseIcon, PlusIcon } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal'
import { phases } from '@/features/assignments/components/PhaseBadge'
import { assignmentClasses } from '@/features/assignments/data/sampleAssignments'
import { planRepository } from '@/features/assignments/lib/repoNames'
import { validateAssignment } from '@/features/assignments/lib/assignValidation'
import type { AssignFormErrors, AssignFormValues } from '@/features/assignments/lib/assignValidation'
import type { Assignment, FileType } from '@/features/assignments/types'
import { sampleStudents } from '@/features/students/data/sampleStudents'
import { todayIso } from '@/lib/dates'
import { useI18n } from '@/lib/i18n'

interface Props {
  /** The assignment being edited, or null when creating. */
  assignment: Assignment | null
  onSave: (values: AssignFormValues) => void
  onClose: () => void
}

const fileTypes: FileType[] = ['PDF', 'DOCX', 'Images', 'ZIP']
const fieldClass =
  'w-full rounded-lg border bg-sunken px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent'
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent'

export default function AssignForm({ assignment, onSave, onClose }: Props) {
  const { t } = useI18n()
  const [values, setValues] = useState<AssignFormValues>({
    title: assignment?.title ?? '',
    className: assignment?.className ?? '',
    description: assignment?.description ?? '',
    deadline: assignment?.deadline ?? '',
    phase: assignment?.phase ?? 'in-progress',
    maxScore: String(assignment?.maxScore ?? 100),
    maxFileSizeMb: String(assignment?.maxFileSizeMb ?? 10),
    fileTypes: assignment?.allowedFileTypes ?? ['PDF'],
    tasks: assignment?.tasks?.map((task) => task.title) ?? [''],
    assignees: assignment?.assignees ?? [],
  })
  const [errors, setErrors] = useState<AssignFormErrors>({})
  const [studentQuery, setStudentQuery] = useState('')

  const set = <K extends keyof AssignFormValues>(field: K, value: AssignFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateAssignment(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSave(values)
  }

  // The repository and branch names that will be created, updated as the teacher fills the form in.
  const plan = useMemo(
    () => planRepository(values.className, values.title, values.assignees, assignment?.repo),
    [values.className, values.title, values.assignees, assignment?.repo],
  )

  const students = useMemo(() => {
    const q = studentQuery.trim().toLowerCase()
    return sampleStudents.filter((s) => s.fullName.toLowerCase().includes(q))
  }, [studentQuery])

  const allShownSelected = students.length > 0 && students.every((s) => values.assignees.includes(s.fullName))
  const someShownSelected = students.some((s) => values.assignees.includes(s.fullName))

  const toggleStudent = (name: string) =>
    set('assignees', values.assignees.includes(name) ? values.assignees.filter((n) => n !== name) : [...values.assignees, name])

  const toggleShown = () => {
    const shown = students.map((s) => s.fullName)
    set(
      'assignees',
      allShownSelected
        ? values.assignees.filter((n) => !shown.includes(n))
        : [...new Set([...values.assignees, ...shown])],
    )
  }

  const toggleType = (type: FileType) =>
    set('fileTypes', values.fileTypes.includes(type) ? values.fileTypes.filter((x) => x !== type) : [...values.fileTypes, type])

  const setTask = (index: number, title: string) =>
    set('tasks', values.tasks.map((x, i) => (i === index ? title : x)))

  const field = (
    name: keyof AssignFormValues,
    label: string,
    input: (props: object) => React.ReactNode,
    span?: 'full',
  ) => {
    const error = errors[name]
    return (
      <div className={span ? 'sm:col-span-2' : undefined}>
        <label htmlFor={`assign-${name}`} className="text-sm font-medium">{label}</label>
        <div className="mt-1">
          {input({
            id: `assign-${name}`,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error ? `assign-${name}-error` : undefined,
            className: `${fieldClass} ${error ? 'border-red-500' : 'border-line'}`,
          })}
        </div>
        {error && <p id={`assign-${name}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">{t(error)}</p>}
      </div>
    )
  }

  const groupError = (name: 'fileTypes' | 'assignees') =>
    errors[name] && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t(errors[name])}</p>

  return (
    <Modal title={assignment ? t('asg.formEdit') : t('asg.formAdd')} size="lg" scroll={false} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          {field('title', t('asg.fieldTitle'), (props) => (
            <input {...props} type="text" autoComplete="off" value={values.title} onChange={(e) => set('title', e.target.value)} />
          ), 'full')}
          {field('className', t('asg.fieldClass'), (props) => (
            <Dropdown
              {...props}
              className="py-2"
              invalid={Boolean(errors.className)}
              wrapperClassName="block w-full"
              value={values.className}
              placeholder={t('asg.chooseClass')}
              options={assignmentClasses.map((c) => ({ value: c, label: c }))}
              onChange={(v) => set('className', v)}
            />
          ))}
          {field('deadline', t('asg.fieldDeadline'), (props) => (
            <input {...props} type="date" min={todayIso()} value={values.deadline} onChange={(e) => set('deadline', e.target.value)} />
          ))}
          {field('phase', t('asg.fieldStatus'), (props) => (
            <Dropdown
              {...props}
              className="py-2"
              wrapperClassName="block w-full"
              value={values.phase}
              options={phases.map((p) => ({ value: p.value, label: t(p.labelKey) }))}
              onChange={(v) => set('phase', v as AssignFormValues['phase'])}
            />
          ))}
          {field('maxScore', t('asg.fieldScore'), (props) => (
            <input {...props} type="number" inputMode="numeric" min={1} value={values.maxScore} onChange={(e) => set('maxScore', e.target.value)} />
          ))}
          {field('description', t('asg.fieldDescription'), (props) => (
            <textarea {...props} rows={3} value={values.description} onChange={(e) => set('description', e.target.value)} />
          ), 'full')}
          <fieldset>
            <legend className="text-sm font-medium">{t('asg.fieldTypes')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {fileTypes.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-sunken px-3 py-1.5 text-sm"
                >
                  <Checkbox checked={values.fileTypes.includes(type)} onChange={() => toggleType(type)} />
                  {type}
                </label>
              ))}
            </div>
            {groupError('fileTypes')}
          </fieldset>
          {field('maxFileSizeMb', t('asg.fieldSize'), (props) => (
            <input {...props} type="number" inputMode="numeric" min={1} value={values.maxFileSizeMb} onChange={(e) => set('maxFileSizeMb', e.target.value)} />
          ))}

          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium">{t('asg.fieldTasks')}</legend>
            <ul className="mt-2 space-y-2">
              {values.tasks.map((task, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => setTask(i, e.target.value)}
                    placeholder={t('asg.taskPh', { n: String(i + 1) })}
                    aria-label={t('asg.taskPh', { n: String(i + 1) })}
                    className={`${fieldClass} border-line`}
                  />
                  <button
                    type="button"
                    onClick={() => set('tasks', values.tasks.filter((_, index) => index !== i))}
                    aria-label={t('asg.removeTask', { n: String(i + 1) })}
                    className={`rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-fg ${focusRing}`}
                  >
                    <CloseIcon />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => set('tasks', [...values.tasks, ''])}
              className={`mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-soft ${focusRing} [&>svg]:h-4 [&>svg]:w-4`}
            >
              <PlusIcon />
              {t('asg.addTask')}
            </button>
          </fieldset>

          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium">
              {t('asg.fieldStudents')}{' '}
              <span className="font-normal text-muted">· {t('asg.selectedCount', { count: String(values.assignees.length) })}</span>
            </legend>
            <div className={`mt-2 overflow-hidden rounded-lg border ${errors.assignees ? 'border-red-500' : 'border-line'}`}>
              <div className="flex items-center gap-3 border-b border-line bg-sunken px-3 py-2">
                <Checkbox
                  checked={allShownSelected}
                  indeterminate={someShownSelected && !allShownSelected}
                  onChange={toggleShown}
                  aria-label={t('asg.selectAll')}
                />
                <input
                  type="search"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder={t('asg.searchStudents')}
                  aria-label={t('asg.searchStudents')}
                  className={`min-w-0 flex-1 bg-transparent text-sm ${focusRing}`}
                />
              </div>
              <ul className="max-h-48 divide-y divide-line overflow-y-auto">
                {students.length === 0 && <li className="p-4 text-center text-sm text-muted">{t('asg.noStudents')}</li>}
                {students.map((s) => (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-hover">
                      <Checkbox checked={values.assignees.includes(s.fullName)} onChange={() => toggleStudent(s.fullName)} />
                      <span className="min-w-0 flex-1 truncate">{s.fullName}</span>
                      <span className="truncate text-xs text-muted">{s.email}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            {groupError('assignees')}

            <div className="mt-3 rounded-lg border border-line bg-sunken p-3 text-xs">
              <p className="text-muted">{t('asg.repoNote')}</p>
              <p className="mt-2">
                <span className="text-muted">{t('asg.repoName')}: </span>
                <span className="break-all font-mono font-medium">{plan.name}</span>
              </p>
              {plan.branches.length > 0 && (
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-muted">{t('asg.repoBranches')}:</span>
                  {plan.branches.slice(0, 6).map((b) => (
                    <span key={b.student} className="rounded bg-surface px-1.5 py-0.5 font-mono">{b.branch}</span>
                  ))}
                  {plan.branches.length > 6 && <span className="text-muted">+{plan.branches.length - 6}</span>}
                </p>
              )}
            </div>
          </fieldset>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-line px-5 py-4">
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
    </Modal>
  )
}
