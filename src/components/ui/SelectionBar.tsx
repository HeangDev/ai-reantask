import { TrashIcon } from '@/components/ui/icons'
import { useI18n } from '@/lib/i18n'

interface Props {
  count: number
  onDelete: () => void
  onClear: () => void
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

/** Replaces a table's filters while rows are selected: how many, delete them, or clear the selection. */
export default function SelectionBar({ count, onDelete, onClear }: Props) {
  const { t } = useI18n()

  return (
    <div className="flex flex-1 items-center gap-3 text-sm">
      <span className="font-medium">{t('stu.selected', { count: String(count) })}</span>
      <button
        type="button"
        onClick={onDelete}
        className={`flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-medium text-red-600 transition-colors hover:bg-hover dark:text-red-400 [&>svg]:h-4 [&>svg]:w-4 ${focusRing}`}
      >
        <TrashIcon />
        {t('stu.deleteSelected')}
      </button>
      <button
        type="button"
        onClick={onClear}
        className={`rounded px-1 text-muted hover:text-fg hover:underline ${focusRing}`}
      >
        {t('stu.clearSelection')}
      </button>
    </div>
  )
}
