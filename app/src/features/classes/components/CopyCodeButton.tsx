import { useState } from 'react'
import { useI18n } from '@/lib/i18n'

/** Copies a class code so the teacher can paste it to students; the label reads "Copied" for a moment. */
export default function CopyCodeButton({ code, className = '' }: { code: string; className?: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be blocked; the code stays selectable on screen.
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        void copy()
      }}
      aria-label={`${t('acct.copy')}: ${t('cls.code')} ${code}`}
      className={`rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <span aria-live="polite">{copied ? t('acct.copied') : t('acct.copy')}</span>
    </button>
  )
}
