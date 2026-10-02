import { useState } from 'react'
import Button from '@/components/ui/Button'
import { ClassIcon, PlusIcon } from '@/components/ui/icons'
import JoinClassDialog from '@/features/classes/components/JoinClassDialog'
import { useClasses } from '@/features/classes/store/classesStore'
import { useJoinedClassIds, usePendingClassIds } from '@/features/classes/store/joinRequestsStore'
import { useI18n } from '@/lib/i18n'

/** The student's joined classes and the way to join another one with a class code. */
export default function MyClasses() {
  const { t } = useI18n()
  const classes = useClasses()
  const joined = useJoinedClassIds()
  const pendingIds = usePendingClassIds()
  const [joining, setJoining] = useState(false)
  const mine = classes.filter((c) => joined.has(c.id))
  const waiting = classes.filter((c) => pendingIds.has(c.id))

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3">
      <span className="flex items-center gap-1.5 text-sm font-medium [&>svg]:h-4 [&>svg]:w-4">
        <ClassIcon />
        {t('join.myClasses')}
      </span>

      {mine.length === 0 && waiting.length === 0 ? (
        <span className="text-sm text-muted">{t('join.none')}</span>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {mine.map((c) => (
            <li key={c.id} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-fg">
              {c.name}
            </li>
          ))}
          {waiting.map((c) => (
            <li
              key={c.id}
              title={t('join.pending')}
              className="rounded-full border border-dashed border-amber-400 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
            >
              {c.name} · {t('join.pending')}
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        size="sm"
        onClick={() => setJoining(true)}
        aria-haspopup="dialog"
        className="ml-auto flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4"
      >
        <PlusIcon />
        {t('join.button')}
      </Button>

      {joining && <JoinClassDialog onClose={() => setJoining(false)} />}
    </div>
  )
}
