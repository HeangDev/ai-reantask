import { useEffect, useRef, useState } from 'react'
import { env } from '@/shared/config/env'
import { useI18n } from '@/shared/i18n'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.900-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.900-5.800l-7.500-5.800c-2.100 1.400-4.800 2.300-8.400 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.6 14.600 48 24 48z" />
    </svg>
  )
}

const CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise: Promise<void> | null = null

/** Loads Google Identity Services once, and only on pages that show the button. */
function loadGoogleScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Google script failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

interface Props {
  /** `signin_with` on the login page, `signup_with` on the register page. */
  text: 'signin_with' | 'signup_with'
  disabled?: boolean
  /** Called with the Google ID token; send it to the API. */
  onCredential: (credential: string) => void
}

const looks =
  'flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg shadow-sm transition-colors'

/**
 * A "Continue with Google" button drawn in the app's style. Google only allows its own iframe button to start
 * sign-in, so that button is laid over this one, invisible but clickable; the page below it is what people see.
 * It stays visible but disabled when no client ID is configured or Google could not load.
 */
export function GoogleAuthButton({ text, disabled = false, onCredential }: Props) {
  const { t, language } = useI18n()
  const wrapper = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  // The callback is read at click time so the button is not re-rendered when the parent's handler changes.
  const handler = useRef(onCredential)
  useEffect(() => {
    handler.current = onCredential
  })
  const unavailable = !CLIENT_ID || loadFailed

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    loadGoogleScript()
      .then(() => {
        const id = window.google?.accounts.id
        if (cancelled || !id || !overlay.current || !wrapper.current) return
        id.initialize({ client_id: CLIENT_ID, callback: (response) => handler.current(response.credential) })
        overlay.current.replaceChildren()
        // Google draws its button between 200 and 400 px wide, so fill the form column as far as it allows.
        const width = Math.min(400, Math.max(200, Math.round(wrapper.current.clientWidth)))
        id.renderButton(overlay.current, { theme: 'outline', size: 'large', text, shape: 'rectangular', width, locale: language })
      })
      .catch(() => !cancelled && setLoadFailed(true))
    return () => {
      cancelled = true
    }
  }, [text, language])

  const label = t('auth.continueGoogle')

  if (unavailable) {
    return (
      <div>
        <button type="button" disabled className={`${looks} cursor-not-allowed opacity-60`}>
          <GoogleLogo />
          {label}
        </button>
        <p className="mt-2 text-center text-xs text-muted">{t(CLIENT_ID ? 'auth.googleFailed' : 'auth.googleUnavailable')}</p>
      </div>
    )
  }

  return (
    <div
      ref={wrapper}
      aria-disabled={disabled}
      className={`group relative h-10 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`${looks} group-hover:bg-hover group-active:scale-[0.99] group-focus-within:outline-2 group-focus-within:outline-offset-2 group-focus-within:outline-accent`}
      >
        <GoogleLogo />
        {label}
      </span>
      {/* Google's button: transparent, centred over the visible one so it receives the click. */}
      <div ref={overlay} className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.01]" />
    </div>
  )
}
