import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import StatCards from '@/features/dashboard/components/StatCards'
import DueLabel from '@/features/assignments/components/DueLabel'
import { statusStyles } from '@/features/assignments/components/StatusBadge'
import type { Assignment } from '@/features/assignments/types'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import type { DashboardData } from '@/features/dashboard/types'
import { useI18n } from '@/lib/i18n'

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <section className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          to="/assignments"
          className="rounded text-xs font-medium text-accent-fg hover:underline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {t('dash.viewAll')}
        </Link>
      </div>
      {children}
    </section>
  )
}

function Row({ assignment, trailing }: { assignment: Assignment; trailing: ReactNode }) {
  const { t } = useI18n()
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${statusStyles[assignment.status].dot}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{assignment.title}</span>
        <span className="block truncate text-xs text-muted">{assignment.className}</span>
      </span>
      <span className="shrink-0 text-right text-xs">{trailing}</span>
      <span className="sr-only">{t(`status.${assignment.status}` as const)}</span>
    </li>
  )
}

function DashboardContent({ data }: { data: DashboardData }) {
  const { t } = useI18n()
  const { stats, upcoming, recent } = data

  const activityText = (a: Assignment) =>
    a.status === 'graded' && a.score !== undefined
      ? t('dash.activity.graded', { score: String(a.score), max: String(a.maxScore) })
      : t('dash.activity.submitted', { file: a.submittedFile ?? '' })

  return (
    <>
      <StatCards stats={stats} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title={t('dash.upcoming')}>
          {upcoming.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('dash.noUpcoming')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((a) => (
                <Row key={a.id} assignment={a} trailing={<DueLabel deadline={a.deadline} className="font-medium" />} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('dash.recent')}>
          {recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('dash.noActivity')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((a) => (
                <Row key={a.id} assignment={a} trailing={<span className="text-muted">{activityText(a)}</span>} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { t } = useI18n()
  const { state, retry } = useDashboard()

  return (
    <section className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>
      <p className="mb-4 mt-1 text-sm text-muted">{t('dash.subtitle')}</p>

      {state.status === 'loading' && (
        <p role="status" className="p-10 text-center text-sm text-muted">
          {t('dash.loading')}
        </p>
      )}

      {state.status === 'error' && (
        <div role="alert" className="rounded-xl border border-line bg-surface p-10 text-center">
          <p className="font-semibold">{t('dash.errorTitle')}</p>
          <p className="mb-4 mt-1 text-sm text-muted">{t('dash.errorDesc')}</p>
          <Button type="button" onClick={retry}>
            {t('dash.retry')}
          </Button>
        </div>
      )}

      {state.status === 'empty' && (
        <div className="rounded-xl border border-line bg-surface p-10 text-center">
          <p className="font-semibold">{t('dash.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('dash.emptyDesc')}</p>
        </div>
      )}

      {state.status === 'success' && <DashboardContent data={state.data} />}
    </section>
  )
}
