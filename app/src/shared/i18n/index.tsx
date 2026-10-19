import { useMemo } from 'react'
import type { ReactNode } from 'react'
import i18n from 'i18next'
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next'
import en from './locales/en.json'
import km from './locales/km.json'
import ko from './locales/ko.json'

export type TranslationKey = keyof typeof en
export type Language = 'en' | 'km' | 'ko'

// Each language is shown in its own script, so people can find theirs.
export const languageNames: Record<Language, string> = { en: 'English', km: 'ខ្មែរ', ko: '한국어' }

const locales: Record<Language, string> = { en: 'en-US', km: 'km-KH', ko: 'ko-KR' }
const STORAGE_KEY = 'language'
const DEFAULT_LANGUAGE: Language = 'en'

function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'km' || value === 'ko'
}

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLanguage(saved)) return saved
  } catch {
    // storage unavailable — fall back to the default language
  }
  return DEFAULT_LANGUAGE
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    km: { translation: km },
    ko: { translation: ko },
  },
  lng: initialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: ['en', 'km', 'ko'],
  // Keys look like "nav.main", and strings use {name} placeholders.
  keySeparator: false,
  nsSeparator: false,
  interpolation: { prefix: '{', suffix: '}', escapeValue: false },
  returnNull: false,
})

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // ignore
  }
})
document.documentElement.lang = i18n.language

interface I18nValue {
  language: Language
  locale: string
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, vars?: Record<string, string>) => string
}

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export function useI18n(): I18nValue {
  const { t, i18n: instance } = useTranslation()
  const language: Language = isLanguage(instance.language) ? instance.language : DEFAULT_LANGUAGE

  return useMemo<I18nValue>(
    () => ({
      language,
      locale: locales[language],
      setLanguage: (next) => {
        void instance.changeLanguage(next)
      },
      t: (key, vars) => t(key, vars),
    }),
    [language, instance, t],
  )
}
