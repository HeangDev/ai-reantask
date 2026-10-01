import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Dropdown from '@/components/ui/Dropdown'
import Modal from '@/components/ui/Modal'
import AssignmentCard from '@/features/assignments/components/AssignmentCard'
import AssignmentDetail from '@/features/assignments/components/AssignmentDetail'
import { assignmentsActions, useAssignments } from '@/features/assignments/store/assignmentsStore'
import { needsAction } from '@/features/assignments/lib/status'
import type { Assignment } from '@/features/assignments/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

type Sort = 'due' | 'class' | 'title'

const sorts: Sort[] = ['due', 'class', 'title']

const compare: Record<Sort, (a: Assignment, b: Assignment) => number> = {
  due: (a, b) => a.deadline.localeCompare(b.deadline),
  class: (a, b) => a.className.localeCompare(b.className) || a.deadline.localeCompare(b.deadline),
  title: (a, b) => a.title.localeCompare(b.title),
}

// The board follows the student's journey: do the work, wait for the teacher, see the grade.
const lanes: { id: string; titleKey: TranslationKey; dot: string; includes: (a: Assignment) => boolean }[] = [
  { id: 'action', titleKey: 'board.action', dot: 'bg-amber-500', includes: needsAction },
  { id: 'waiting', titleKey: 'board.waiting', dot: 'bg-blue-500', includes: (a) => a.status === 'submitted' },
  { id: 'graded', titleKey: 'board.graded', dot: 'bg-emerald-500', includes: (a) => a.status === 'graded' },
]

export default function AssignmentsPage() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim().toLowerCase()

  const assignments = useAssignments()
  const [openId, setOpenId] = useState<string | null>(null)
  const [className, setClassName] = useState('')
  const [sort, setSort] = useState<Sort>('due')

  const classNames = useMemo(() => [...new Set(assignments.map((a) => a.className))].sort(), [assignments])

  const matches = useMemo(
    () =>
      assignments
        .filter((a) => (!className || a.className === className) && `${a.title} ${a.className}`.toLowerCase().includes(query))
        .sort(compare[sort]),
    [assignments, className, query, sort],
  )

  const attentionCount = assignments.filter(needsAction).length
  const opened = assignments.find((a) => a.id === openId) ?? null

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.assignments')}</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {attentionCount > 0 ? t('page.attention', { count: String(attentionCount) }) : t('page.caughtUp')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            {t('board.class')}
            <Dropdown
              value={className}
              onChange={setClassName}
              options={[{ value: '', label: t('board.allClasses') }, ...classNames.map((c) => ({ value: c, label: c }))]}
              wrapperClassName="w-44"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            {t('sort.label')}
            <Dropdown
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              options={sorts.map((s) => ({ value: s, label: t(`sort.${s}` as const) }))}
              wrapperClassName="w-36"
            />
          </label>
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="mt-6 rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">{t('list.empty')}</p>
      ) : (
        <div className="mt-5 grid items-start gap-4 lg:grid-cols-3">
          {lanes.map((lane) => {
            const items = matches.filter(lane.includes)
            return (
              <section
                key={lane.id}
                aria-labelledby={`lane-${lane.id}`}
                className="rounded-xl border border-line bg-sunken/60 p-2.5"
              >
                <h2 id={`lane-${lane.id}`} className="flex items-center gap-2 px-1.5 pb-2.5 pt-1 text-sm font-semibold">
                  <span className={`h-2 w-2 rounded-full ${lane.dot}`} aria-hidden="true" />
                  {t(lane.titleKey)}
                  <span className="rounded-md bg-surface px-1.5 text-xs font-medium text-muted">{items.length}</span>
                </h2>
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                    {t('board.empty')}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((a) => (
                      <li key={a.id}>
                        <AssignmentCard assignment={a} onOpen={setOpenId} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      {opened && (
        <Modal title={t('detail.title')} size="lg" onClose={() => setOpenId(null)}>
          <AssignmentDetail assignment={opened} onSubmit={assignmentsActions.submitWork} />
        </Modal>
      )}
    </section>
  )
}
