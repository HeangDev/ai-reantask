import { Link } from 'react-router-dom'
import { ErrorState } from '@/shared/components/ErrorState'
import { paths } from '@/shared/config/paths'
import { useI18n } from '@/shared/i18n'

function HomeLink() {
  const { t } = useI18n()
  return (
    <Link
      to={paths.home}
      className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {t('errors.goHome')}
    </Link>
  )
}

export function NotFoundPage() {
  return (
    <ErrorState titleKey="errors.notFoundTitle" descriptionKey="errors.notFoundDesc">
      <HomeLink />
    </ErrorState>
  )
}

export function ForbiddenPage() {
  return (
    <ErrorState titleKey="errors.forbiddenTitle" descriptionKey="errors.forbiddenDesc">
      <HomeLink />
    </ErrorState>
  )
}

/** Shown while the first lazy route chunk loads. */
export function Splash() {
  const { t } = useI18n()
  return (
    <div role="status" className="flex h-screen items-center justify-center text-sm text-muted">
      {t('app.loading')}
    </div>
  )
}
