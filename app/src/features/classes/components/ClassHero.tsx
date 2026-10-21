import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '@/features/assignments'
import { GradientBanner } from '@/shared/components/GradientBanner'
import {
  ArrowLeftIcon,
  AssignmentsIcon,
  CalendarIcon,
  CheckIcon,
  ClassIcon,
  ClockIcon,
  CodeIcon,
  MailIcon,
  PlusIcon,
  StudentsIcon,
  SubjectIcon,
} from '@/shared/components/icons'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { CopyCodeButton } from '@/features/classes/components/CopyCodeButton'
import type { ClassSummary } from '@/features/classes/lib/classRoster'
import type { SchoolClass } from '@/features/classes/types'
import { paths } from '@/shared/config/paths'
import { useI18n } from '@/shared/i18n'

interface Props {
  schoolClass: SchoolClass
  /** What the signed-in teacher teaches in this class; empty when unknown. */
  subject: string
  studentCount: number
  summary: ClassSummary
  onAddStudents: () => void
  onInvite: () => void
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const secondaryButton = `flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover ${focusRing} [&>svg]:h-4 [&>svg]:w-4`

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-fg [&>svg]:h-4 [&>svg]:w-4"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <div className="truncate text-sm font-semibold">{children}</div>
      </div>
    </div>
  )
}

function StatTile({ icon, label, value, attention = false }: { icon: ReactNode; label: string; value: number; attention?: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border bg-surface p-4 ${
        attention ? 'border-amber-400 dark:border-amber-500/60' : 'border-line'
      }`}
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sunken text-muted [&>svg]:h-5 [&>svg]:w-5"
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted">{label}</p>
      </div>
    </li>
  )
}

/** The top of a class page: which class, what the teacher teaches in it, its code, and the numbers that matter. */
export function ClassHero({ schoolClass: c, subject, studentCount, summary, onAddStudents, onInvite }: Props) {
  const { t, locale } = useI18n()

  return (
    <>
      <Link
        to={paths.classes}
        className={`inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-fg ${focusRing} [&>svg]:h-4 [&>svg]:w-4`}
      >
        <ArrowLeftIcon />
        {t('cdet.back')}
      </Link>

      <header className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <GradientBanner colorKey={c.id} title={c.name} icon={<ClassIcon />} actions={<StatusBadge status={c.status} />} />

        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Fact icon={<SubjectIcon />} label={t('cdet.yourSubject')}>
              <span title={subject || undefined}>{subject || '—'}</span>
            </Fact>
            <Fact icon={<CalendarIcon />} label={t('cdet.period')}>
              {formatDate(c.startDate, locale)} – {formatDate(c.endDate, locale)}
            </Fact>
            <Fact icon={<CodeIcon />} label={t('cls.code')}>
              <span className="flex items-center gap-2">
                <span className="font-mono tracking-wider">{c.code}</span>
                <CopyCodeButton code={c.code} />
              </span>
            </Fact>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onAddStudents} aria-haspopup="dialog" className={secondaryButton}>
              <PlusIcon />
              {t('cls.addStudents')}
            </button>
            <button type="button" onClick={onInvite} aria-haspopup="dialog" className={secondaryButton}>
              <MailIcon />
              {t('cls.invite')}
            </button>
          </div>
        </div>
      </header>

      <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<StudentsIcon />} label={t('cdet.statStudents')} value={studentCount} />
        <StatTile icon={<AssignmentsIcon />} label={t('cdet.statAssignments')} value={summary.assignments} />
        <StatTile icon={<ClockIcon />} label={t('cdet.statDueSoon')} value={summary.dueSoon} attention={summary.dueSoon > 0} />
        <StatTile icon={<CheckIcon />} label={t('cdet.statToReview')} value={summary.toReview} attention={summary.toReview > 0} />
      </ul>
    </>
  )
}
