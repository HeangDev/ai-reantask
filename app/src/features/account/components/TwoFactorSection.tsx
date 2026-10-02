import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { RolesIcon } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import SectionCard from '@/features/account/components/SectionCard'
import TextField from '@/components/ui/TextField'
import { verifyTotp } from '@/features/account/lib/totp'
import { generateSetupKey, isValidCode } from '@/features/account/lib/validation'
import { accountService } from '@/features/account/services/accountService'
import { accountActions, useTwoFactorEnabled } from '@/features/account/store/accountStore'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const outlineButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function SetupModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { notify } = useToast()
  const [setupKey] = useState(generateSetupKey)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<TranslationKey>()
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(setupKey.replace(/\s/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be blocked; the key stays selectable on screen.
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!isValidCode(code)) {
      setCodeError('acct.errCode')
      return
    }
    setSaving(true)
    try {
      const secret = setupKey.replace(/\s/g, '')
      if (!(await verifyTotp(secret, code))) {
        setCodeError('login.errWrongCode')
        return
      }
      await accountService.enableTwoFactor(code)
      accountActions.enableTwoFactor(secret)
      notify({ title: t('acct.twoFactorEnabled'), subtitle: t('acct.twoFactorEnabledDesc') })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('acct.twoFactorSetup')} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-5 p-5">
        <div>
          <p className="text-sm font-medium">1. {t('acct.twoFactorStep1')}</p>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-sunken p-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{t('acct.twoFactorKey')}</p>
              <p className="mt-0.5 break-all font-mono text-sm font-semibold tracking-wider">{setupKey}</p>
            </div>
            <button type="button" onClick={copy} className={outlineButton}>
              {copied ? t('acct.copied') : t('acct.copy')}
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">2. {t('acct.twoFactorStep2')}</p>
          <TextField
            label={t('acct.twoFactorCode')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(v) => {
              setCode(v.replace(/\D/g, ''))
              setCodeError(undefined)
            }}
            error={codeError}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('dialog.cancel')}
          </button>
          <Button type="submit" disabled={saving}>
            {saving ? t('acct.saving') : t('acct.verifyEnable')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function TwoFactorSection() {
  const { t } = useI18n()
  const { notify } = useToast()
  const enabled = useTwoFactorEnabled()
  const [dialog, setDialog] = useState<'setup' | 'disable' | null>(null)

  const disable = async () => {
    setDialog(null)
    await accountService.disableTwoFactor()
    accountActions.disableTwoFactor()
    notify({ variant: 'danger', title: t('acct.twoFactorDisabled'), subtitle: t('acct.twoFactorDisabledDesc') })
  }

  return (
    <SectionCard
      title={t('acct.twoFactorTitle')}
      description={t('acct.twoFactorDesc')}
      icon={<RolesIcon />}
      badge={
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            enabled
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-sunken text-muted'
          }`}
        >
          {enabled ? t('acct.twoFactorOn') : t('acct.twoFactorOff')}
        </span>
      }
    >
      {enabled ? (
        <button
          type="button"
          onClick={() => setDialog('disable')}
          aria-haspopup="dialog"
          className={`${outlineButton} text-red-600 dark:text-red-400`}
        >
          {t('acct.twoFactorDisable')}
        </button>
      ) : (
        <Button type="button" onClick={() => setDialog('setup')} aria-haspopup="dialog">
          {t('acct.twoFactorEnable')}
        </Button>
      )}

      {dialog === 'setup' && <SetupModal onClose={() => setDialog(null)} />}
      <ConfirmDialog
        open={dialog === 'disable'}
        icon={<RolesIcon />}
        title={t('acct.twoFactorDisableTitle')}
        message={t('acct.twoFactorDisableMsg')}
        confirmLabel={t('acct.twoFactorDisable')}
        onCancel={() => setDialog(null)}
        onConfirm={disable}
      />
    </SectionCard>
  )
}
