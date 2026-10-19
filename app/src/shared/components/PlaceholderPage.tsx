import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

export function PlaceholderPage({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useI18n()

  return (
    <section className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
    </section>
  )
}
