import Avatar from '@/components/ui/Avatar'
import { planRepository } from '@/features/assignments/lib/repoNames'
import { setUpRepository } from '@/features/assignments/services/setUpRepository'
import type { Assignment, RepoStatus } from '@/features/assignments/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const status: Record<RepoStatus, { labelKey: TranslationKey; tone: string }> = {
  creating: { labelKey: 'asg.repoCreating', tone: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
  simulated: { labelKey: 'asg.repoPreview', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  failed: { labelKey: 'asg.repoFailed', tone: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
}

const button =
  'rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/** The GitHub repository set up for an assignment, with the branch each student works on. */
export default function RepositoryCard({ assignment }: { assignment: Assignment }) {
  const { t } = useI18n()
  const { repo } = assignment
  const assignees = assignment.assignees ?? []

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t('asg.repoTitle')}</h2>
        {repo && (
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${status[repo.status].tone}`}>
            {t(status[repo.status].labelKey)}
          </span>
        )}
      </div>

      {repo ? (
        <>
          <p className="mt-3 break-all font-mono text-sm font-medium">{repo.name}</p>
          <p className="mt-0.5 text-xs text-muted">
            {t('asg.repoDefault')}: <span className="font-mono">{repo.defaultBranch}</span>
          </p>

          {repo.status === 'simulated' && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              {t('asg.repoSimulated')}
            </p>
          )}

          <h3 className="mb-2 mt-4 text-xs font-semibold text-muted">
            {t('asg.repoBranches')} · {repo.branches.length}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {repo.branches.map((b) => (
              <li key={b.student} className="flex items-center gap-2.5 rounded-lg bg-sunken px-3 py-2">
                <Avatar name={b.student} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{b.student}</span>
                  <span className="block truncate font-mono text-[11px] text-muted">{b.branch}</span>
                </span>
              </li>
            ))}
          </ul>

          {repo.status === 'failed' && (
            <button type="button" onClick={() => setUpRepository(assignment.id, repo)} className={`${button} mt-4`}>
              {t('asg.repoRetry')}
            </button>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">{t('asg.repoNone')}</p>
          {assignees.length > 0 && (
            <button
              type="button"
              onClick={() => setUpRepository(assignment.id, planRepository(assignment.className, assignment.title, assignees))}
              className={`${button} mt-3`}
            >
              {t('asg.repoSetUp')}
            </button>
          )}
        </>
      )}
    </section>
  )
}
