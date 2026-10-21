import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '@/shared/components/icons'
import { useI18n } from '@/shared/i18n'

// Full class names so Tailwind can see them.
export const tones = {
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
}

interface StatLinkProps {
  to: string
  label: string
  value: number
  detail: string
  icon: ReactNode
  tone: keyof typeof tones
  /** Draws the card with an amber outline: something here needs the admin. */
  highlight?: boolean
}

/** A headline number that links to the page it counts. */
export function StatLink({ to, label, value, detail, icon, tone, highlight = false }: StatLinkProps) {
  return (
    <li>
      <Link
        to={to}
        className={`group flex h-full items-center gap-4 rounded-2xl border bg-surface p-4 transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-accent ${
          highlight ? 'border-amber-400 dark:border-amber-500/60' : 'border-line'
        }`}
      >
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl [&>svg]:h-6 [&>svg]:w-6 ${tones[tone]}`}>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-muted">{label}</span>
          <span className="block text-3xl font-bold leading-tight tabular-nums">{value}</span>
          <span className="block truncate text-xs text-muted">{detail}</span>
        </span>
        <span
          className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent-fg [&>svg]:h-4 [&>svg]:w-4"
          aria-hidden="true"
        >
          <ChevronRightIcon />
        </span>
      </Link>
    </li>
  )
}

/** Active (green) against inactive (grey) as one bar, with the counts beside it. */
export function SplitBar({ label, active, total }: { label: string; active: number; total: number }) {
  const { t } = useI18n()
  const percent = total === 0 ? 0 : Math.round((active / total) * 100)

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted">
          <span className="font-semibold text-fg">{active}</span> {t('usr.active')} · {total - active} {t('usr.inactive')}
        </span>
      </div>
      <div role="img" aria-label={`${label}: ${active} / ${total}`} className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
