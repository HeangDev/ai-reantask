import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'
/** What the user picked: a fixed theme, or "system" to follow the device. */
export type ThemePreference = Theme | 'system'

export const DEFAULT_ACCENT = '#5b5fe8'

interface ThemeValue {
  /** The theme currently applied (a "system" preference is resolved to light or dark). */
  theme: Theme
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
  /** Base accent colour as a #rrggbb hex string. */
  accent: string
  setAccent: (hex: string) => void
  resetAccent: () => void
}

const THEME_KEY = 'theme'
const ACCENT_KEY = 'accent'
const HEX = /^#[0-9a-f]{6}$/i
const DARK_QUERY = '(prefers-color-scheme: dark)'

const ThemeContext = createContext<ThemeValue | null>(null)

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null // storage unavailable
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function initialPreference(): ThemePreference {
  const saved = read(THEME_KEY)
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
}

function initialAccent(): string {
  const saved = read(ACCENT_KEY)
  return saved && HEX.test(saved) ? saved.toLowerCase() : DEFAULT_ACCENT
}

// WCAG relative luminance, used to darken pale accents so white text stays readable on them.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(initialPreference)
  const [accent, setAccentState] = useState<string>(initialAccent)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_QUERY).matches)

  // Follow the device setting live while "system" is selected.
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const theme: Theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    write(THEME_KEY, preference)
  }, [preference])

  useEffect(() => {
    const style = document.documentElement.style
    const lum = luminance(accent)
    style.setProperty('--accent-base', accent)
    style.setProperty('--accent-strong-amount', lum > 0.4 ? '50%' : lum > 0.25 ? '65%' : '85%')
    write(ACCENT_KEY, accent)
  }, [accent])

  const value = useMemo<ThemeValue>(
    () => ({
      theme,
      preference,
      setPreference,
      toggleTheme: () => setPreference(theme === 'dark' ? 'light' : 'dark'),
      accent,
      setAccent: (hex) => HEX.test(hex) && setAccentState(hex.toLowerCase()),
      resetAccent: () => setAccentState(DEFAULT_ACCENT),
    }),
    [theme, preference, accent],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
