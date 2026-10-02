import { GridIcon, ListIcon } from '@/components/ui/icons'
import { useI18n } from '@/lib/i18n'

export type ViewMode = 'grid' | 'table'

interface Props {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

/** Two icon buttons that switch a page between cards and a table. */
export default function ViewSwitch({ view, onChange }: Props) {
  const { t } = useI18n()
  const items = [
    { value: 'grid', label: t('view.grid'), icon: <GridIcon /> },
    { value: 'table', label: t('view.table'), icon: <ListIcon /> },
  ] as const

  return (
    <div role="group" aria-label={t('view.label')} className="flex w-fit rounded-lg border border-line bg-sunken p-0.5">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={view === item.value}
          aria-label={item.label}
          title={item.label}
          onClick={() => onChange(item.value)}
          className={`rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4 ${
            view === item.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
          }`}
        >
          {item.icon}
        </button>
      ))}
    </div>
  )
}
