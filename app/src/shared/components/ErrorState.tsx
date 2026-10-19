import type { ReactNode } from 'react'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

interface Props {
  titleKey?: TranslationKey
  descriptionKey: TranslationKey
  /** Support reference from the failed request. */
  requestId?: string
  onRetry?: () => void
  /** Extra actions beside the retry button. */
  children?: ReactNode
}

/** What happened, what the user can do, and an optional reference for support (error-handling.md §2). */
export function ErrorState({ titleKey = 'errors.loadFailedTitle', descriptionKey, requestId, onRetry, children }: Props) {
  const { t } = useI18n()
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
      <p className="text-sm text-muted">{t(descriptionKey)}</p>
      {requestId && <p className="text-xs text-muted">{t('errors.requestId', { id: requestId })}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-lg bg-accent px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('errors.retry')}
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
