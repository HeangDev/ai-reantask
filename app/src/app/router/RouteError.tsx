import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ErrorState } from '@/shared/components/ErrorState'
import { useI18n } from '@/shared/i18n'
import { paths } from '@/shared/config/paths'
import { ApiError } from '@/shared/api/errors'

const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i

/** The route-level error page: render and loader failures, a missing route, and a new deploy's stale chunks. */
export function RouteError() {
  const { t } = useI18n()
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <ErrorState titleKey="errors.notFoundTitle" descriptionKey="errors.notFoundDesc" />
  }

  const isChunkError = error instanceof Error && CHUNK_ERROR.test(error.message)
  return (
    <ErrorState
      titleKey="errors.pageTitle"
      descriptionKey={isChunkError ? 'errors.conflict' : error instanceof ApiError ? error.messageKey : 'errors.pageDesc'}
      requestId={error instanceof ApiError ? error.requestId : undefined}
      onRetry={() => window.location.reload()}
    >
      <Link
        to={paths.home}
        className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {t('errors.goHome')}
      </Link>
    </ErrorState>
  )
}
