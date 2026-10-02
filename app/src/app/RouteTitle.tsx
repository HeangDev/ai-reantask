import { useMatches } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { TranslationKey } from '@/lib/i18n'

/** Route `handle` data: the translation key of the page name shown in the tab title. */
export interface RouteHandle {
  titleKey?: TranslationKey
}

/** Renders nothing; keeps the tab title in sync with the deepest matched route. */
export default function RouteTitle() {
  const matches = useMatches()
  const handle = [...matches].reverse().find((m) => (m.handle as RouteHandle | undefined)?.titleKey)?.handle as
    | RouteHandle
    | undefined
  useDocumentTitle(handle?.titleKey)
  return null
}
