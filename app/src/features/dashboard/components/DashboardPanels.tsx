import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { statusStyles } from '@/features/assignments/components/StatusBadge'
import type { Assignment } from '@/features/assignments/types'
import { useSession } from '@/features/auth/store/authStore'
import { useI18n } from '@/lib/i18n'

/** Titled card on the dashboard, with a "View all" link to the assignments. */
export function Panel({ title, to, children }: { title: string; to?: string; children: ReactNode }) {
  const { t } = useI18n()
  const role = useSession()?.role
  const link = to ?? (role === 'teacher' ? '/assign' : '/assignments')

  return (
    <section className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          to={link}
          className="rounded text-xs font-medium text-accent-fg hover:underline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {t('dash.viewAll')}
        </Link>
      </div>
      {children}
    </section>
  )
}

export function Row({ assignment, trailing }: { assignment: Assignment; trailing: ReactNode }) {
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
