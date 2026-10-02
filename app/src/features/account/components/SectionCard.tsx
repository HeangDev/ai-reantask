import type { ReactNode } from 'react'

interface Props {
  title: string
  description: string
  icon: ReactNode
  /** Red styling for destructive areas such as deleting the account. */
  danger?: boolean
  /** Shown at the right of the header, such as a status badge. */
  badge?: ReactNode
  children: ReactNode
}

/** Titled card used by every section of the Account page. */
export default function SectionCard({ title, description, icon, danger = false, badge, children }: Props) {
  const tone = danger
    ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
    : 'bg-accent-soft text-accent-fg'

  return (
    <section
      className={`overflow-hidden rounded-xl border bg-surface ${danger ? 'border-red-300 dark:border-red-500/40' : 'border-line'}`}
    >
      <header className="flex items-start gap-3 border-b border-line p-4">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${tone}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
        {badge}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}
