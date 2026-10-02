import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

export default function PlaceholderPage({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useI18n()

  return (
    <section className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
    </section>
  )
}
