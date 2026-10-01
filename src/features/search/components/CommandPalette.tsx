import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { SearchIcon } from '@/components/ui/icons'
import { useSearchItems } from '@/features/search/hooks/useSearchItems'
import { groupOrder, searchItems, toTerms } from '@/features/search/lib/searchItems'
import type { SearchGroup } from '@/features/search/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const groupTitles: Record<SearchGroup, TranslationKey> = {
  pages: 'search.pages',
  assignments: 'nav.assignments',
  tasks: 'search.tasks',
  actions: 'search.actions',
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>
  const parts = text.split(new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-transparent font-semibold text-accent-fg">{part}</mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

const kbd = 'rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted'

interface Props {
  onClose: () => void
}

/** Global search. Mounted only while open, so its state resets every time it is shown. */
export default function CommandPalette({ onClose }: Props) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const items = useSearchItems(onClose)
  const results = useMemo(() => searchItems(items, query), [items, query])
  const terms = toTerms(query)

  // The native <dialog> provides focus trapping, Escape to close and the backdrop.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  useEffect(() => {
    document.getElementById(`result-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[active]?.onSelect()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-label={t('header.search')}
      className="confirm-dialog mx-auto mb-auto mt-[8vh] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-lg border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40"
    >
      <div className="flex max-h-[55vh] flex-col">
        <div className="flex items-center gap-2.5 border-b border-line px-3">
          <span className="text-muted [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true"><SearchIcon /></span>
          <input
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={results.length ? `result-${active}` : undefined}
            aria-label={t('header.search')}
            autoComplete="off"
            spellCheck={false}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder={t('header.search')}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
          <kbd className={kbd}>Esc</kbd>
        </div>

        <div id="search-results" role="listbox" aria-label={t('header.search')} className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12px] text-muted">{t('search.empty', { query: query.trim() })}</p>
          ) : (
            groupOrder.map((group) => {
              const groupItems = results.filter((r) => r.group === group)
              if (groupItems.length === 0) return null
              return (
                <div key={group} role="group" aria-label={t(groupTitles[group])} className="mb-1 last:mb-0">
                  <p className="px-2.5 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted" aria-hidden="true">
                    {t(groupTitles[group])}
                  </p>
                  {groupItems.map((item) => {
                    const index = results.indexOf(item)
                    const selected = index === active
                    return (
                      <div
                        key={item.id}
                        id={`result-${index}`}
                        role="option"
                        aria-selected={selected}
                        onMouseMove={() => setActive(index)}
                        onClick={item.onSelect}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 ${
                          selected ? 'bg-accent-soft' : ''
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border [&>svg]:h-3.5 [&>svg]:w-3.5 ${
                            selected ? 'border-accent/40 bg-surface text-accent-fg' : 'border-line bg-sunken text-muted'
                          }`}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium">
                            <Highlight text={item.label} terms={terms} />
                          </span>
                          {item.description && (
                            <span className="block truncate text-[10px] text-muted">{item.description}</span>
                          )}
                        </span>
                        {selected && <kbd className={kbd}>↵</kbd>}
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        <div className="hidden items-center gap-3 border-t border-line bg-sunken px-3 py-1.5 text-[10px] text-muted sm:flex">
          <span className="flex items-center gap-1.5"><kbd className={kbd}>↑</kbd><kbd className={kbd}>↓</kbd>{t('search.navigate')}</span>
          <span className="flex items-center gap-1.5"><kbd className={kbd}>↵</kbd>{t('search.open')}</span>
          <span className="flex items-center gap-1.5"><kbd className={kbd}>Esc</kbd>{t('search.close')}</span>
        </div>
      </div>
    </dialog>
  )
}
