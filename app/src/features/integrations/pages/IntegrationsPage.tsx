import { useMemo, useState } from 'react'
import { SearchIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import IntegrationCard from '@/features/integrations/components/IntegrationCard'
import { integrations } from '@/features/integrations/data/integrations'
import { integrationsActions, useConnectedIntegrations } from '@/features/integrations/store/integrationsStore'
import type { IntegrationFilter, IntegrationId } from '@/features/integrations/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const tabs: { value: IntegrationFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'int.tabAll' },
  { value: 'connected', labelKey: 'int.tabConnected' },
  { value: 'disconnected', labelKey: 'int.tabDisconnected' },
]

const focusRing = 'focus-visible:outline-2 focus-visible:outline-accent'

export default function IntegrationsPage() {
  const { t } = useI18n()
  const { notify } = useToast()
  const connected = useConnectedIntegrations()
  const [filter, setFilter] = useState<IntegrationFilter>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return integrations.filter((item) => {
      const isConnected = connected.has(item.id)
      const matchesFilter = filter === 'all' || (filter === 'connected' ? isConnected : !isConnected)
      return matchesFilter && item.name.toLowerCase().includes(q)
    })
  }, [connected, filter, query])

  const toggle = (id: IntegrationId, name: string) => {
    if (integrationsActions.toggle(id)) {
      notify({ title: t('int.connected', { name }), subtitle: t('int.connectedDesc', { name }) })
    } else {
      notify({ variant: 'danger', title: t('int.disconnected', { name }), subtitle: t('int.disconnectedDesc', { name }) })
    }
  }

  return (
    <section className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{t('nav.integration')}</h1>
      <p className="mt-1 text-sm text-muted">{t('int.pageDesc')}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label={t('int.tabs')}
          className="flex w-fit max-w-full overflow-x-auto rounded-xl border border-line bg-sunken p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={filter === tab.value}
              onClick={() => setFilter(tab.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${focusRing} ${
                filter === tab.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <label className="relative sm:w-64">
          <span className="sr-only">{t('int.search')}</span>
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted [&>svg]:h-4 [&>svg]:w-4">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('int.searchPh')}
            className={`w-full rounded-lg border border-line bg-sunken py-1.5 pl-8 pr-3 text-sm ${focusRing}`}
          />
        </label>
      </div>

      <h2 className="mt-5 text-lg font-semibold">{t('int.section')}</h2>
      <p className="text-sm text-muted">{t('int.sectionDesc')}</p>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-xl border border-line p-10 text-center text-sm text-muted">
          {t('int.noMatch')}
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item, index) => (
            <IntegrationCard
              key={item.id}
              integration={item}
              index={index}
              connected={connected.has(item.id)}
              onToggle={() => toggle(item.id, item.name)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
