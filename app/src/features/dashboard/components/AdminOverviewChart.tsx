import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

// One-hue ramp (the colours live in index.css), so the slices read as parts of one whole.
const roleColors = ['var(--phase-1)', 'var(--phase-2)', 'var(--phase-3)']

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  students: number
  teachers: number
  /** Everyone who is neither a student nor a teacher, i.e. admins. */
  admins: number
  /** Active against all, for each thing the admin manages. */
  splits: { labelKey: TranslationKey; active: number; total: number }[]
}

/** The admin overview: a donut of users by role, and an active / inactive bar for classes and subjects. */
export function AdminOverviewChart({ students, teachers, admins, splits }: Props) {
  const { t } = useI18n()
  const total = students + teachers + admins
  const slices = [
    { key: 'role.student', value: students },
    { key: 'role.teacher', value: teachers },
    { key: 'role.admin', value: admins },
  ] as const satisfies readonly { key: TranslationKey; value: number }[]

  // Each slice is a stroked arc starting where the previous one ended.
  let offset = 0
  const arcs = slices.map((slice, i) => {
    const length = total === 0 ? 0 : (slice.value / total) * CIRCUMFERENCE
    const arc = { ...slice, length, offset, color: roleColors[i] }
    offset += length
    return arc
  })

  return (
    <section className="mt-4 rounded-xl border border-line bg-surface" aria-labelledby="overview-title">
      <h2 id="overview-title" className="border-b border-line px-4 py-3 text-sm font-semibold">
        {t('adash.overview')}
      </h2>

      <div className="grid gap-6 p-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs text-muted">{t('adash.usersByRole')}</h3>
          {total === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('adash.noUsers')}</p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-6">
              <div className="relative h-36 w-36 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                  <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="14" className="stroke-sunken" />
                  {arcs
                    .filter((a) => a.length > 0)
                    .map((a) => (
                      <circle
                        key={a.key}
                        cx="50"
                        cy="50"
                        r={RADIUS}
                        fill="none"
                        strokeWidth="14"
                        stroke={a.color}
                        strokeDasharray={`${a.length} ${CIRCUMFERENCE - a.length}`}
                        strokeDashoffset={-a.offset}
                      >
                        <title>{`${t(a.key)}: ${a.value}`}</title>
                      </circle>
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold leading-none tabular-nums">{total}</span>
                  <span className="mt-1 text-xs text-muted">{t('adash.usersTotal')}</span>
                </div>
              </div>

              <ul className="min-w-40 flex-1 space-y-1.5 text-sm">
                {arcs.map((a) => (
                  <li key={a.key} className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: a.color }} />
                    <span className="flex-1 text-muted">{t(a.key)}</span>
                    <span className="font-medium tabular-nums">{a.value}</span>
                    <span className="w-10 text-right text-xs text-muted tabular-nums">
                      {Math.round((a.value / total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs text-muted">{t('adash.activeVsInactive')}</h3>
          <ul className="mt-3 space-y-4">
            {splits.map((s) => {
              const percent = s.total === 0 ? 0 : Math.round((s.active / s.total) * 100)
              return (
                <li key={s.labelKey}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{t(s.labelKey)}</span>
                    <span className="text-xs text-muted">
                      <span className="font-semibold text-fg">{s.active}</span> {t('usr.active')} · {s.total - s.active}{' '}
                      {t('usr.inactive')}
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${t(s.labelKey)}: ${s.active} / ${s.total}`}
                    className="mt-1.5 flex h-5 overflow-hidden rounded-md bg-sunken"
                  >
                    <div
                      className="flex h-full items-center bg-emerald-500 px-1.5 text-xs font-medium text-white transition-[width]"
                      style={{ width: `${percent}%` }}
                    >
                      {percent >= 15 ? `${percent}%` : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
