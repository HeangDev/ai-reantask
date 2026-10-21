import { Link } from 'react-router-dom'
import { DueLabel, PhaseBadge } from '@/features/assignments'
import type { Assignment } from '@/features/assignments'
import { Button } from '@/shared/components/Button'
import { PlusIcon } from '@/shared/components/icons'
import { paths } from '@/shared/config/paths'
import { useI18n } from '@/shared/i18n'

interface Props {
  assignments: Assignment[]
  onCreate: () => void
}

/** The work already set for this class, soonest deadline first, with a way to set more. */
export function ClassAssignments({ assignments, onCreate }: Props) {
  const { t } = useI18n()
  const sorted = [...assignments].sort((a, b) => a.deadline.localeCompare(b.deadline))

  return (
    <section className="rounded-xl border border-line bg-surface" aria-labelledby="class-assignments-title">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 id="class-assignments-title" className="text-sm font-semibold">
          {t('cdet.assignmentsTitle')} <span className="font-normal text-muted">({assignments.length})</span>
        </h2>
        <Button type="button" size="sm" onClick={onCreate} className="flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4">
          <PlusIcon />
          {t('asg.add')}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center">
          <p className="font-semibold">{t('cdet.assignmentsEmptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('cdet.assignmentsEmptyDesc')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {sorted.map((a) => (
            <li key={a.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={paths.assignDetail(a.id)}
                  className="min-w-0 truncate text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {a.title}
                </Link>
                <PhaseBadge phase={a.phase ?? 'in-progress'} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                <DueLabel deadline={a.deadline} />
                <span>{t('cdet.assignedTo', { count: String(a.assignees?.length ?? 0) })}</span>
                <span>
                  {t('cdet.handedIn', { done: String(a.submissions?.length ?? 0), total: String(a.assignees?.length ?? 0) })}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
