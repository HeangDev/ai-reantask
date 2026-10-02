import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Button from '@/components/ui/Button'
import { CameraIcon, UserIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import SectionCard from '@/features/account/components/SectionCard'
import TextField from '@/components/ui/TextField'
import { validateAvatar, validateName } from '@/features/account/lib/validation'
import { accountActions, useProfile } from '@/features/account/store/accountStore'
import { roleLabelKey } from '@/features/auth/lib/roleLabels'
import { useSession } from '@/features/auth/store/authStore'
import { DEFAULT_AVATAR_URL } from '@/lib/currentUser'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const outlineButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40'

export default function ProfileSection() {
  const { t } = useI18n()
  const { notify } = useToast()
  const profile = useProfile()
  const role = useSession()?.role
  const fileInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(profile.fullName)
  const [avatar, setAvatar] = useState(profile.avatarUrl)
  const [nameError, setNameError] = useState<TranslationKey>()
  const [avatarError, setAvatarError] = useState<TranslationKey>()

  const dirty = name.trim() !== profile.fullName || avatar !== profile.avatarUrl

  const pickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be chosen again
    if (!file) return
    const error = validateAvatar(file)
    setAvatarError(error)
    if (error) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(String(reader.result))
    reader.readAsDataURL(file)
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    const error = validateName(name)
    setNameError(error)
    if (error) return
    accountActions.updateProfile({ fullName: name.trim(), avatarUrl: avatar })
    setName(name.trim())
    notify({ variant: 'info', title: t('acct.profileSaved'), subtitle: t('acct.profileSavedDesc') })
  }

  return (
    <SectionCard title={t('acct.profileTitle')} description={t('acct.profileDesc')} icon={<UserIcon />}>
      <form onSubmit={save} noValidate className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <img src={avatar} alt="" className="h-20 w-20 rounded-full border-2 border-line object-cover" />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              aria-label={t('acct.changePhoto')}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-accent-strong text-white shadow transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&>svg]:h-4 [&>svg]:w-4"
            >
              <CameraIcon />
            </button>
          </div>
          <div>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className={outlineButton}>
                {t('acct.changePhoto')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatar(DEFAULT_AVATAR_URL)
                  setAvatarError(undefined)
                }}
                disabled={avatar === DEFAULT_AVATAR_URL}
                className={outlineButton}
              >
                {t('acct.removePhoto')}
              </button>
            </div>
            <p className={`mt-2 text-xs ${avatarError ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}>
              {avatarError ? t(avatarError) : t('acct.photoHint')}
            </p>
          </div>
          <input ref={fileInput} type="file" accept="image/*" onChange={pickPhoto} className="sr-only" tabIndex={-1} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('acct.fullName')}
            value={name}
            onChange={(v) => {
              setName(v)
              setNameError(undefined)
            }}
            error={nameError}
            autoComplete="name"
          />
          <TextField
            label={t('acct.email')}
            type="email"
            value={profile.email}
            onChange={() => {}}
            disabled
            readOnly
            hint={t('acct.emailLocked')}
          />
          {role && (
            <TextField
              label={t('acct.role')}
              value={t(roleLabelKey[role])}
              onChange={() => {}}
              disabled
              readOnly
              hint={t('acct.roleLocked')}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!dirty}>
            {t('acct.save')}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}
