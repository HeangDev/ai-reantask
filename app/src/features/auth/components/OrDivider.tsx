import { useI18n } from '@/lib/i18n'

/** A rule with "or" in the middle, between the password form and the Google button. */
export default function OrDivider() {
  const { t } = useI18n()
  return (
    <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted" role="separator">
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      {t('auth.or')}
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  )
}
