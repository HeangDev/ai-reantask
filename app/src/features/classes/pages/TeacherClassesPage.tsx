import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { SearchIcon } from '@/shared/components/icons'
import { TableEmpty } from '@/shared/components/TableEmpty'
import { ViewSwitch } from '@/shared/components/ViewSwitch'
import type { ViewMode } from '@/shared/components/ViewSwitch'
import { InviteStudentsDialog } from '@/features/classes/components/InviteStudentsDialog'
import { TeacherClassCard } from '@/features/classes/components/TeacherClassCard'
import { TeacherClassesTable } from '@/features/classes/components/TeacherClassesTable'
import { useClassOverview } from '@/features/classes/hooks/useClassOverview'
import { useClassesQuery } from '@/features/classes/api/useClasses'
import { inScope } from '@/features/classes/hooks/useVisibleClasses'
import { useTeacherClassScope } from '@/features/teachers'
import { useViewMode } from '@/shared/hooks/useViewMode'
import { useI18n } from '@/shared/i18n'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'
// How many cards show at first, and how many more each "Show more" adds.
const PAGE_SIZE = 6

/** The teacher's classes, as cards or a table: class name, subject and total students, with a way to invite students. */
export function TeacherClassesPage() {
  const { t } = useI18n()
  // The API returns every class, so keep only the ones this teacher teaches.
  const classesQuery = useClassesQuery()
  const scope = useTeacherClassScope()
  const classes = useMemo(() => inScope(classesQuery.data ?? [], scope), [classesQuery.data, scope])
  const overviews = useClassOverview(classes)
  const [view, setView] = useViewMode('teacher-classes-view')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [inviteId, setInviteId] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return classes.filter((c) => `${c.name} ${overviews[c.id]?.subject ?? ''}`.toLowerCase().includes(q))
  }, [classes, overviews, query])

  const inviting = classes.find((c) => c.id === inviteId) ?? null
  const chooseView = (next: ViewMode) => {
    setView(next)
    setLimit(PAGE_SIZE)
  }

  const emptyTitle = classesQuery.isPending
    ? t('cls.loading')
    : classes.length === 0
      ? t('tcls.emptyTitle')
      : t('cls.noMatch')
  const emptyDesc = !classesQuery.isPending && classes.length === 0 ? t('tcls.emptyDesc') : undefined

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.classes')}</h1>
          <p className="mt-1 text-sm text-muted">{t('tcls.desc')}</p>
        </div>
        <ViewSwitch view={view} onChange={chooseView} />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">{t('cls.search')}</span>
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE_SIZE)
            }}
            placeholder={t('cls.searchPh')}
            className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
          />
        </label>
      </div>

      {classesQuery.isError && (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm text-red-600 dark:text-red-400">
          {t('cls.loadFailed')}
          <button
            type="button"
            onClick={() => void classesQuery.refetch()}
            className={`rounded-lg border border-line px-3 py-1 text-xs font-medium text-fg hover:bg-hover ${focusRing}`}
          >
            {t('usr.tryAgain')}
          </button>
        </div>
      )}

      {view === 'table' ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
          <TeacherClassesTable
            classes={visible}
            overviews={overviews}
            onInvite={setInviteId}
            emptyMessage={<TableEmpty title={emptyTitle} description={emptyDesc} />}
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4 rounded-xl border border-line p-10 text-center">
          <p className="font-semibold">{emptyTitle}</p>
          {emptyDesc && <p className="mt-1 text-sm text-muted">{emptyDesc}</p>}
        </div>
      ) : (
        <>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {visible.slice(0, limit).map((c, index) => (
                <TeacherClassCard
                  key={c.id}
                  schoolClass={c}
                  overview={overviews[c.id] ?? { subject: '', totalStudents: 0 }}
                  index={index}
                  onInvite={() => setInviteId(c.id)}
                />
              ))}
            </AnimatePresence>
          </ul>

          {visible.length > PAGE_SIZE && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <p className="text-xs text-muted">
                {t('notif.showing', { shown: String(Math.min(limit, visible.length)), total: String(visible.length) })}
              </p>
              {limit < visible.length && (
                <button
                  type="button"
                  onClick={() => setLimit((n) => n + PAGE_SIZE)}
                  className={`rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-hover ${focusRing}`}
                >
                  {t('notif.showMore', { count: String(visible.length - limit) })}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {inviting && <InviteStudentsDialog schoolClass={inviting} onClose={() => setInviteId(null)} />}
    </section>
  )
}
