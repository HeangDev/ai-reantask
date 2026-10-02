import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import { PlusIcon, SearchIcon } from '@/components/ui/icons'
import JoinClassDialog from '@/features/classes/components/JoinClassDialog'
import StudentClassesTable from '@/features/classes/components/StudentClassesTable'
import { teachingOf } from '@/features/classes/lib/classTeaching'
import type { ClassTeaching } from '@/features/classes/lib/classTeaching'
import { useClasses } from '@/features/classes/store/classesStore'
import { useJoinedClassIds, usePendingClassIds } from '@/features/classes/store/joinRequestsStore'
import { useTeachers } from '@/features/teachers/store/teachersStore'
import TableEmpty from '@/components/ui/TableEmpty'
import { useI18n } from '@/lib/i18n'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

/** The classes the signed-in student has joined. */
export default function StudentClassesPage() {
  const { t } = useI18n()
  const classes = useClasses()
  const teachers = useTeachers()
  const joined = useJoinedClassIds()
  const pendingIds = usePendingClassIds()
  const [query, setQuery] = useState('')
  const [joining, setJoining] = useState(false)

  const waiting = useMemo(() => classes.filter((c) => pendingIds.has(c.id)), [classes, pendingIds])
  const mine = useMemo(() => classes.filter((c) => joined.has(c.id)), [classes, joined])

  const teaching = useMemo(
    () => Object.fromEntries(mine.map((c) => [c.id, teachingOf(c, teachers)])) as Record<string, ClassTeaching>,
    [mine, teachers],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mine.filter((c) => {
      const info = teaching[c.id]
      return `${c.name} ${c.description} ${info.teachers.join(' ')} ${info.subjects.join(' ')}`.toLowerCase().includes(q)
    })
  }, [mine, teaching, query])

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.myClasses')}</h1>
          <p className="mt-1 text-sm text-muted">{t('sc.desc')}</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setJoining(true)}
          aria-haspopup="dialog"
          className="flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4"
        >
          <PlusIcon />
          {t('join.button')}
        </Button>
      </div>

      {waiting.length > 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-semibold">{t('join.pendingTitle')}</p>
          <p className="mt-0.5">{waiting.map((c) => c.name).join(', ')}</p>
          <p className="mt-0.5 text-xs opacity-80">{t('join.pendingHint')}</p>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="p-3">
          <label className="relative block sm:max-w-xs">
            <span className="sr-only">{t('cls.search')}</span>
            <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('sc.searchPh')}
              className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
            />
          </label>
        </div>

        <StudentClassesTable
          classes={visible}
          teaching={teaching}
          emptyMessage={
            mine.length === 0 ? (
              <TableEmpty title={t('sc.emptyTitle')} description={t('sc.emptyDesc')} />
            ) : (
              <TableEmpty title={t('cls.noMatch')} />
            )
          }
        />
      </div>

      {joining && <JoinClassDialog onClose={() => setJoining(false)} />}
    </section>
  )
}
