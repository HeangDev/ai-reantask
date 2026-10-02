import { useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

export const APP_NAME = 'ReanTask'

/** Sets the browser tab title to "ReanTask - Page name", in the current language. */
export function useDocumentTitle(titleKey: TranslationKey | undefined) {
  const { t } = useI18n()
  const page = titleKey ? t(titleKey) : ''

  useEffect(() => {
    document.title = page ? `${APP_NAME} - ${page}` : APP_NAME
  }, [page])
}
