import { useMatches } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import type { TranslationKey } from '@/shared/i18n'

/** Route `handle` data: the translation key of the page name shown in the tab title. */
export interface RouteHandle {
  titleKey?: TranslationKey
}

/** Renders nothing; keeps the tab title in sync with the deepest matched route. */
export function RouteTitle() {
  const matches = useMatches()
  const handle = [...matches].reverse().find((m) => (m.handle as RouteHandle | undefined)?.titleKey)?.handle as
    | RouteHandle
    | undefined
  useDocumentTitle(handle?.titleKey)
  return null
}
