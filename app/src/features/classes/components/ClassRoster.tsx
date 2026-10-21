import { useMemo, useState } from 'react'
import { Avatar } from '@/shared/components/Avatar'
import { Button } from '@/shared/components/Button'
import { Checkbox } from '@/shared/components/Checkbox'
import { AssignmentsIcon, SearchIcon } from '@/shared/components/icons'
import type { RosterRow } from '@/features/classes/lib/classRoster'
import { useI18n } from '@/shared/i18n'

interface Props {
  rows: RosterRow[]
  /** The teacher wants to set an assignment for these students. */
  onAssign: (rows: RosterRow[]) => void
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/** Handed-in share as a short bar plus text, so it never relies on colour alone. */
function Progress({ row }: { row: RosterRow }) {
  const { t } = useI18n()
  if (row.assigned === 0) return <span className="text-xs text-muted">{t('cdet.nothingAssigned')}</span>
  const percent = Math.round((row.submitted / row.assigned) * 100)
  return (
    <div className="w-32">
      <p className="text-xs text-muted">{t('cdet.handedIn', { done: String(row.submitted), total: String(row.assigned) })}</p>
      <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

/** The students in a class: search, pick one or many, and set an assignment for them. */
export function ClassRoster({ rows, onAssign }: Props) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => `${r.name} ${r.email}`.toLowerCase().includes(q))
  }, [rows, query])

  const chosen = rows.filter((r) => selected.has(r.id))
  const allVisibleChosen = visible.length > 0 && visible.every((r) => selected.has(r.id))
  const someVisibleChosen = visible.some((r) => selected.has(r.id))

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  const toggleVisible = () =>
    setSelected((current) => {
      const next = new Set(current)
      for (const r of visible) {
        if (allVisibleChosen) next.delete(r.id)
        else next.add(r.id)
      }
      return next
    })

  return (
    <section className="rounded-xl border border-line bg-surface" aria-labelledby="roster-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 id="roster-title" className="text-sm font-semibold">
          {t('cdet.rosterTitle')} <span className="font-normal text-muted">({rows.length})</span>
        </h2>

        {chosen.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium" aria-live="polite">
              {t('stu.selected', { count: String(chosen.length) })}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onAssign(chosen)
                setSelected(new Set())
              }}
              className="flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4"
            >
              <AssignmentsIcon />
              {t('cdet.assignSelected')}
            </Button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className={`rounded px-1 text-muted hover:text-fg hover:underline ${focusRing}`}
            >
              {t('stu.clearSelection')}
            </button>
          </div>
        ) : (
          rows.length > 0 && (
            <label className="relative w-full sm:w-64">
              <span className="sr-only">{t('cdet.rosterSearch')}</span>
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('cdet.rosterSearchPh')}
                className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
              />
            </label>
          )
        )}
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-semibold">{t('cdet.rosterEmptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('cdet.rosterEmptyDesc')}</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted">{t('cdet.rosterNoMatch')}</p>
      ) : (
        <>
          <label className="flex items-center gap-3 border-b border-line bg-sunken px-4 py-2 text-xs text-muted">
            <Checkbox checked={allVisibleChosen} indeterminate={!allVisibleChosen && someVisibleChosen} onChange={toggleVisible} />
            {t('cdet.selectAll')}
          </label>
          <ul className="divide-y divide-line">
            {visible.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                <Checkbox
                  checked={selected.has(row.id)}
                  onChange={() => toggle(row.id)}
                  aria-label={t('stu.selectRow', { name: row.name })}
                />
                <Avatar name={row.name} />
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="truncate text-xs text-muted">{row.email || '—'}</p>
                </div>
                <Progress row={row} />
                <button
                  type="button"
                  onClick={() => onAssign([row])}
                  aria-label={t('cdet.assignOne', { name: row.name })}
                  className={`flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover ${focusRing} [&>svg]:h-4 [&>svg]:w-4`}
                >
                  <AssignmentsIcon />
                  {t('cdet.assign')}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
