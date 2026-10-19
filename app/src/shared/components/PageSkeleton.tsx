import { useI18n } from '@/shared/i18n'

/** Placeholder blocks shown while a page chunk or its first data loads, so the layout does not jump. */
export function PageSkeleton() {
  const { t } = useI18n()
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('app.loading')}
      className="mx-auto max-w-7xl animate-pulse space-y-4 p-4 sm:p-6"
    >
      <div className="h-8 w-1/3 rounded-lg bg-hover" />
      <div className="h-4 w-1/2 rounded bg-hover" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 rounded-xl bg-hover" />
        <div className="h-32 rounded-xl bg-hover" />
        <div className="h-32 rounded-xl bg-hover" />
      </div>
    </div>
  )
}
