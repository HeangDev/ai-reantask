import { Link } from 'react-router-dom'
import { DueLabel } from '@/features/assignments'
import { ClassIcon } from '@/shared/components/icons'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { ClassSummary } from '@/features/dashboard/types'
import { paths } from '@/shared/config/paths'
import { useI18n } from '@/shared/i18n'

/**
 * One of the teacher's classes: the subject they teach in it, who is in it, how much of its work is done and what
 * is due next. The whole card opens the class; the name is the link, stretched over the card.
 */
export function TeacherClassTile({ c }: { c: ClassSummary }) {
  const { t } = useI18n()
  const percent = c.assignments === 0 ? 0 : Math.round((c.completed / c.assignments) * 100)

  return (
    <li className="relative flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition-colors focus-within:border-accent hover:border-accent/50">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-fg [&>svg]:h-5 [&>svg]:w-5"
        >
          <ClassIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">
            <Link
              to={paths.classDetail(c.id)}
              className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
            >
              {c.name}
            </Link>
          </h3>
          <p className="truncate text-xs text-muted" title={c.subject || undefined}>
            {c.subject || '—'}
          </p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-sunken px-3 py-2">
          <dt className="text-muted">{t('cls.statStudents')}</dt>
          <dd className="mt-0.5 text-base font-bold leading-none tabular-nums">{c.students}</dd>
        </div>
        <div className="rounded-lg bg-sunken px-3 py-2">
          <dt className="text-muted">{t('cls.statAssignments')}</dt>
          <dd className="mt-0.5 text-base font-bold leading-none tabular-nums">{c.assignments}</dd>
        </div>
      </dl>

      <div>
        <p className="flex items-baseline justify-between text-xs text-muted">
          <span>{t('tdash.completedOf', { done: String(c.completed), total: String(c.assignments) })}</span>
          <span className="font-medium text-fg tabular-nums">{percent}%</span>
        </p>
        <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <p className="text-xs text-muted">
        {t('tdash.nextDue')}:{' '}
        {c.nextDeadline ? <DueLabel deadline={c.nextDeadline} className="font-medium" /> : t('tdash.nothingDue')}
      </p>
    </li>
  )
}
