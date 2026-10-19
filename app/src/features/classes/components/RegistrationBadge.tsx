import type { RegistrationStatus } from '@/features/classes/lib/registration'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

const styles: Record<RegistrationStatus | 'checking', { key: TranslationKey; className: string }> = {
  checking: { key: 'cls.regChecking', className: 'bg-sunken text-muted' },
  registered: { key: 'cls.regRegistered', className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  pending: { key: 'cls.regPending', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  unregistered: { key: 'cls.regUnregistered', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
}

/** A small text label saying whether an invited email already has an account. */
export function RegistrationBadge({ status }: { status: RegistrationStatus | undefined }) {
  const { t } = useI18n()
  const { key, className } = styles[status ?? 'checking']
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>{t(key)}</span>
}
