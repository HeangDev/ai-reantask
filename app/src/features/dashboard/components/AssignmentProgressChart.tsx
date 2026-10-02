import type { AssignmentPhase } from '@/features/assignments/types'
import type { ProgressRow } from '@/features/dashboard/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

// One-hue ordinal ramp, light to dark as the work moves toward done (the colours live in index.css).
const phases: { phase: AssignmentPhase; labelKey: TranslationKey; color: string }[] = [
  { phase: 'in-progress', labelKey: 'asg.phaseInProgress', color: 'var(--phase-1)' },
  { phase: 'in-review', labelKey: 'asg.phaseInReview', color: 'var(--phase-2)' },
  { phase: 'completed', labelKey: 'asg.phaseCompleted', color: 'var(--phase-3)' },
]

interface Props {
  /** Assignment count per phase, across every class. */
  totals: Record<AssignmentPhase, number>
  /** One stacked bar per class, longest first. */
  rows: ProgressRow[]
}

/**
 * Assignment progress: the share completed as the headline number, and a stacked bar per class showing how its
 * assignments split across the three phases. Bar length is the class's assignment count, on one shared scale.
 */
export default function AssignmentProgressChart({ totals, rows }: Props) {
  const { t } = useI18n()
  const total = totals['in-progress'] + totals['in-review'] + totals.completed
  const percent = total === 0 ? 0 : Math.round((totals.completed / total) * 100)
  const longest = Math.max(1, ...rows.map((r) => r.total))
  const phaseLabel = (key: TranslationKey) => t(key)

  return (
    <section className="mt-4 rounded-xl border border-line bg-surface p-4" aria-labelledby="progress-title">
      <h2 id="progress-title" className="text-sm font-semibold">
        {t('tdash.progressTitle')}
      </h2>

      {total === 0 ? (
        <p className="p-6 text-center text-sm text-muted">{t('tdash.noAssignments')}</p>
      ) : (
        <div className="mt-3 grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
          <div>
            <p className="text-3xl font-bold leading-none">{percent}%</p>
            <p className="mt-1 text-xs text-muted">
              {t('tdash.completedOf', { done: String(totals.completed), total: String(total) })}
            </p>

            <ul className="mt-4 space-y-1.5 text-xs">
              {phases.map((p) => (
                <li key={p.phase} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="flex-1 text-muted">{phaseLabel(p.labelKey)}</span>
                  <span className="font-medium">{totals[p.phase]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-1 text-xs text-muted">{t('tdash.byClass')}</p>
            <ul>
              {rows.map((row) => {
                const segments = phases.filter((p) => row.counts[p.phase] > 0)
                return (
                  <li key={row.className} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs text-muted sm:w-36" title={row.className}>
                      {row.className}
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* The stack is as long as the class's share of the busiest class. */}
                      <div className="flex gap-0.5" style={{ width: `${(row.total / longest) * 100}%` }}>
                        {segments.map((p, i) => {
                          const count = row.counts[p.phase]
                          return (
                            // The hit area is taller than the 14px mark, so it is easy to hover.
                            <div
                              key={p.phase}
                              tabIndex={0}
                              aria-label={`${row.className}: ${phaseLabel(p.labelKey)} ${count}`}
                              className="group relative flex h-7 items-center outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
                              style={{ flex: count }}
                            >
                              <span
                                className={`block h-3.5 w-full ${i === segments.length - 1 ? 'rounded-r' : ''}`}
                                style={{ backgroundColor: p.color }}
                              />
                              <span
                                role="tooltip"
                                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-0.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-xs text-fg opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                              >
                                <span className="text-muted">{row.className}</span>
                                <br />
                                {phaseLabel(p.labelKey)}: <span className="font-semibold">{count}</span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs font-medium">{row.total}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* The same numbers as a table, for screen readers. */}
          <table className="sr-only">
            <caption>{t('tdash.progressTitle')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('cls.fieldName')}</th>
                {phases.map((p) => (
                  <th key={p.phase} scope="col">
                    {phaseLabel(p.labelKey)}
                  </th>
                ))}
                <th scope="col">{t('cls.statAssignments')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.className}>
                  <th scope="row">{row.className}</th>
                  {phases.map((p) => (
                    <td key={p.phase}>{row.counts[p.phase]}</td>
                  ))}
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
