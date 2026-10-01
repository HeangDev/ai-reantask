import type { ReactNode } from 'react'
import {
  AssignmentsIcon,
  CheckIcon,
  GlobeIcon,
  MoonIcon,
  PaletteIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  TasksIcon,
} from '@/components/ui/icons'
import { DEFAULT_ACCENT, useTheme } from '@/hooks/useTheme'
import type { ThemePreference } from '@/hooks/useTheme'
import { languageNames, useI18n } from '@/lib/i18n'
import type { Language, TranslationKey } from '@/lib/i18n'

const focusRing = 'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent'

const presets: { key: TranslationKey; hex: string }[] = [
  { key: 'color.indigo', hex: DEFAULT_ACCENT },
  { key: 'color.blue', hex: '#2f80ed' },
  { key: 'color.teal', hex: '#0d9488' },
  { key: 'color.green', hex: '#16a34a' },
  { key: 'color.amber', hex: '#d97706' },
  { key: 'color.rose', hex: '#e11d48' },
  { key: 'color.violet', hex: '#8b5cf6' },
  { key: 'color.slate', hex: '#64748b' },
]

const themes: ThemePreference[] = ['system', 'light', 'dark']
const languages: { code: Language; hint: string }[] = [
  { code: 'en', hint: 'English' },
  { code: 'km', hint: 'Khmer' },
  { code: 'ko', hint: 'Korean' },
]

interface ChoiceProps {
  name: string
  value: string
  checked: boolean
  onSelect: () => void
  label: string
  description?: string
  preview?: ReactNode
}

// A selectable card built on a real radio input, so keyboard and screen readers work natively.
function Choice({ name, value, checked, onSelect, label, description, preview }: ChoiceProps) {
  return (
    <label className="relative flex cursor-pointer">
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span
        className={`flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-2 py-2 sm:gap-3 sm:px-3 transition-colors hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:ring-2 peer-checked:ring-accent/30 ${focusRing}`}
      >
        {preview}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{label}</span>
          {description && <span className="hidden text-xs text-muted sm:block">{description}</span>}
        </span>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border [&>svg]:h-3 [&>svg]:w-3 ${
            checked ? 'border-accent bg-accent-strong text-white' : 'border-line text-transparent'
          }`}
          aria-hidden="true"
        >
          <CheckIcon />
        </span>
      </span>
    </label>
  )
}

// Tiny mock of the app shell in each theme's fixed colours (independent of the active theme).
function ThemeThumb({ theme }: { theme: ThemePreference }) {
  // "System" shows both themes, split down the middle.
  if (theme === 'system') {
    return (
      <span className="relative hidden h-10 w-16 shrink-0 overflow-hidden rounded-md sm:block" aria-hidden="true">
        <ThemeThumb theme="light" />
        <span className="absolute inset-0" style={{ clipPath: 'inset(0 0 0 50%)' }}>
          <ThemeThumb theme="dark" />
        </span>
      </span>
    )
  }
  const c =
    theme === 'dark'
      ? { bg: '#0a0c11', panel: '#11141b', line: '#222836', bar: '#2a2f3d' }
      : { bg: '#f4f5f8', panel: '#ffffff', line: '#e3e6ec', bar: '#d9dde6' }
  return (
    <span className="hidden h-10 w-16 shrink-0 overflow-hidden rounded-md border sm:flex" style={{ background: c.bg, borderColor: c.line }} aria-hidden="true">
      <span className="w-4 border-r" style={{ background: c.panel, borderColor: c.line }} />
      <span className="flex flex-1 flex-col gap-1.5 p-2">
        <span className="h-1.5 w-1/2 rounded-full bg-accent" />
        <span className="h-1.5 w-full rounded-full" style={{ background: c.bar }} />
        <span className="h-1.5 w-3/4 rounded-full" style={{ background: c.bar }} />
        
      </span>
    </span>
  )
}

interface CardProps {
  title: string
  description: string
  icon: ReactNode
  className?: string
  children: ReactNode
}

function Card({ title, description, icon, className = '', children }: CardProps) {
  return (
    <section className={`grid flex-1 items-center gap-2 rounded-2xl border border-line bg-surface p-3 shadow-sm sm:p-4 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-6 ${className}`}>
      <header className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-fg [&>svg]:h-4 [&>svg]:w-4"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="leading-tight">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-0.5 hidden text-sm text-muted md:block">{description}</p>
        </div>
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

// A miniature workspace drawn with the real colour tokens, so it reflects theme and accent changes live.
function LivePreview() {
  const { t } = useI18n()
  const rail = 'flex h-6 w-6 items-center justify-center rounded-md [&>svg]:h-3 [&>svg]:w-3'

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t('settings.preview')}</p>
      <div className="overflow-hidden rounded-xl border border-line bg-canvas shadow-md" aria-hidden="true" style={{ zoom: 1.2 }}>
        <div className="flex h-44">
          <div className="flex w-9 shrink-0 flex-col items-center gap-1.5 border-r border-line bg-rail py-2">
            <span className="mb-1 h-5 w-5 rounded-md bg-linear-to-br from-accent-strong to-violet-500" />
            <span className={`${rail} bg-accent-soft text-accent-fg ring-1 ring-inset ring-accent/40`}><AssignmentsIcon /></span>
            <span className={`${rail} text-muted`}><TasksIcon /></span>
            <span className={`${rail} mt-auto text-muted`}><SettingsIcon /></span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-8 items-center border-b border-line bg-surface px-2">
              <span className="flex h-5 w-full items-center gap-1.5 rounded-md border border-line bg-sunken px-1.5 text-[9px] text-muted [&>svg]:h-2.5 [&>svg]:w-2.5">
                <SearchIcon />
                {t('header.search')}
              </span>
            </div>
            <div className="flex-1 space-y-1.5 p-2">
              <div className="rounded-md border-l-2 border-accent bg-accent-soft px-2 py-1.5">
                <p className="truncate text-[10px] font-medium">Algebra Problem Set 4</p>
                <p className="truncate text-[9px] text-muted">Mathematics 101</p>
              </div>
              <div className="rounded-md border border-line bg-surface px-2 py-1.5">
                <p className="truncate text-[10px] font-medium">Poetry Analysis</p>
                <p className="truncate text-[9px] text-muted">Literature</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="rounded-md bg-accent-strong px-2 py-1 text-[9px] font-medium text-white">{t('detail.submit')}</span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[9px] font-medium text-accent-fg">{t('status.pending')}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                <div className="h-full w-2/3 rounded-full bg-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccentPicker() {
  const { t } = useI18n()
  const { accent, setAccent, resetAccent } = useTheme()
  const isPreset = presets.some((p) => p.hex === accent)

  return (
    <fieldset className="flex min-w-0 flex-wrap items-center gap-2">
      <legend className="sr-only">{t('settings.accent')}</legend>
      {presets.map((p) => {
        const checked = accent === p.hex
        return (
          <label key={p.hex} className="relative block cursor-pointer">
            <input
              type="radio"
              name="accent"
              value={p.hex}
              checked={checked}
              onChange={() => setAccent(p.hex)}
              className="peer sr-only"
            />
            <span
              className={`flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-2 pr-3 transition-colors hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:ring-2 peer-checked:ring-accent/30 ${focusRing}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white [&>svg]:h-3 [&>svg]:w-3" style={{ background: p.hex }} aria-hidden="true">
                {checked && <CheckIcon />}
              </span>
              <span className="text-sm font-medium">{t(p.key)}</span>
            </span>
          </label>
        )
      })}

      <div className="flex items-center gap-2.5 rounded-full border border-line bg-sunken py-1 pl-1.5 pr-1.5">
        <label
          className={`relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-full focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
            isPreset ? '' : 'ring-2 ring-fg ring-offset-2 ring-offset-sunken'
          }`}
          style={{
            background: isPreset
              ? 'conic-gradient(#f43f5e, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #f43f5e)'
              : accent,
          }}
        >
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            aria-label={t('settings.custom')}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <span className="text-sm font-medium">{t('settings.custom')}</span>
        <span className="font-mono text-xs uppercase text-muted">{accent}</span>
        <button
          type="button"
          onClick={resetAccent}
          disabled={accent === DEFAULT_ACCENT}
          className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('settings.reset')}
        </button>
      </div>
    </fieldset>
  )
}

const chip =
  'inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-medium backdrop-blur [&>svg]:h-3.5 [&>svg]:w-3.5'

// Sized to fit the workspace without scrolling on desktop; it only stacks (and scrolls) on small screens.
export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n()
  const { theme, preference, setPreference, accent } = useTheme()

  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:p-4 lg:p-5">
      <section className="relative shrink-0 overflow-hidden rounded-3xl border border-line bg-linear-to-br from-accent-soft via-surface to-surface p-3 sm:p-5">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-6">
          <div>
            <div className="flex items-center gap-3 lg:block">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-strong text-white shadow-lg shadow-accent/30 lg:mb-3 lg:h-11 lg:w-11 [&>svg]:h-5 [&>svg]:w-5"
                aria-hidden="true"
              >
                <SettingsIcon />
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('nav.settings')}</h1>
                <p className="mt-1 hidden max-w-md text-sm text-muted sm:block lg:mt-1.5">{t('settings.subtitle')}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 lg:mt-4">
              <span className={chip}>
                {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
                {t(`settings.${preference}` as const)}
              </span>
              <span className={chip}>
                <span className="h-3 w-3 rounded-full" style={{ background: accent }} aria-hidden="true" />
                <span className="font-mono uppercase">{accent}</span>
              </span>
              <span className={chip}>
                <GlobeIcon />
                {languageNames[language]}
              </span>
            </div>
          </div>
          <div className="hidden [@media(min-width:1024px)_and_(min-height:820px)]:block"><LivePreview /></div>
        </div>
      </section>

      <div className="flex flex-1 flex-col gap-2 lg:gap-3">
        <Card title={t('settings.appearance')} description={t('settings.appearanceDesc')} icon={<SunIcon />}>
          <fieldset className="grid max-w-3xl grid-cols-3 gap-2 sm:gap-3">
            <legend className="sr-only">{t('settings.appearance')}</legend>
            {themes.map((value) => (
              <Choice
                key={value}
                name="theme"
                value={value}
                checked={preference === value}
                onSelect={() => setPreference(value)}
                label={t(`settings.${value}` as const)}
                description={value === 'system' ? t('settings.systemHint') : undefined}
                preview={<ThemeThumb theme={value} />}
              />
            ))}
          </fieldset>
        </Card>

        <Card title={t('settings.accent')} description={t('settings.accentDesc')} icon={<PaletteIcon />}>
          <AccentPicker />
        </Card>

        <Card title={t('header.language')} description={t('settings.languageDesc')} icon={<GlobeIcon />}>
          <fieldset className="grid max-w-3xl grid-cols-3 gap-2 sm:gap-3">
            <legend className="sr-only">{t('header.language')}</legend>
            {languages.map((l) => (
              <Choice
                key={l.code}
                name="language"
                value={l.code}
                checked={language === l.code}
                onSelect={() => setLanguage(l.code)}
                label={languageNames[l.code]}
                description={l.hint}
              />
            ))}
          </fieldset>
        </Card>
      </div>
    </div>
  )
}
