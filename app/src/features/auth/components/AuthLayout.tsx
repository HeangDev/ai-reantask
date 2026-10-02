import type { ReactNode } from 'react'
import RouteTitle from '@/app/RouteTitle'
import Dropdown from '@/components/ui/Dropdown'
import { AssignmentsIcon, CheckIcon, GlobeIcon, TasksIcon } from '@/components/ui/icons'
import { languageNames, useI18n } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'

const features = [
  { icon: <AssignmentsIcon />, key: 'login.feature1' },
  { icon: <TasksIcon />, key: 'login.feature2' },
  { icon: <CheckIcon />, key: 'login.feature3' },
] as const

/** The shell shared by the sign-in, register and forgot-password pages: a brand panel, a language picker and a centred form. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { t, language, setLanguage } = useI18n()

  return (
    <div className="grid min-h-screen bg-canvas text-fg lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <RouteTitle />

      <aside className="relative hidden overflow-hidden bg-linear-to-br from-accent-strong to-violet-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold backdrop-blur-sm"
          >
            R
          </span>
          <span className="text-xl font-semibold">ReanTask</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">{t('login.heroTitle')}</h2>
          <p className="mt-4 text-base text-white/80">{t('login.heroDesc')}</p>
          <ul className="mt-8 space-y-3">
            {features.map((feature) => (
              <li key={feature.key} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm [&>svg]:h-4 [&>svg]:w-4"
                >
                  {feature.icon}
                </span>
                {t(feature.key)}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">© ReanTask</p>
      </aside>

      <main className="flex flex-col p-4 sm:p-8">
        <div className="flex justify-end">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span aria-hidden="true" className="[&>svg]:h-4 [&>svg]:w-4">
              <GlobeIcon />
            </span>
            <span className="sr-only">{t('header.language')}</span>
            <Dropdown
              value={language}
              onChange={(v) => setLanguage(v as Language)}
              options={(Object.keys(languageNames) as Language[]).map((code) => ({ value: code, label: languageNames[code] }))}
              wrapperClassName="w-36"
            />
          </label>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">{children}</div>
      </main>
    </div>
  )
}
