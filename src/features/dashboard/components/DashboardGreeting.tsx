import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const greetingKey = (hour: number): TranslationKey =>
  hour < 12 ? 'dash.greetingMorning' : hour < 18 ? 'dash.greetingAfternoon' : 'dash.greetingEvening'

/** Today's date, a time-of-day greeting for the person, and a one-line summary under it. */
export default function DashboardGreeting({ name, summary }: { name: string; summary: string }) {
  const { t, locale } = useI18n()
  const now = new Date()
  const today = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)

  return (
    <header className="mb-5">
      <p className="text-sm text-muted">{today}</p>
      <h1 className="text-2xl font-bold">{t(greetingKey(now.getHours()), { name })}</h1>
      <p className="mt-1 text-sm text-muted" aria-live="polite">
        {summary}
      </p>
    </header>
  )
}
