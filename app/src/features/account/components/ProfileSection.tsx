import { useRef, useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'
import { Button } from '@/shared/components/Button'
import { CameraIcon, UserIcon } from '@/shared/components/icons'
import { useToast } from '@/shared/components/Toast'
import { SectionCard } from '@/features/account/components/SectionCard'
import { TextField } from '@/shared/components/TextField'
import { validateAvatar, validateName } from '@/features/account/lib/validation'
import { useProfileStore } from '@/shared/store/profileStore'
import { ApiError } from '@/shared/api/http'
import { useMe, useProfile, useUpdateProfile } from '@/features/auth'
import { DEFAULT_AVATAR_URL } from '@/shared/lib/currentUser'
import { useI18n } from '@/shared/i18n'
import type { TranslationKey } from '@/shared/i18n'

const outlineButton =
  'rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40'

export function ProfileSection() {
  const { t } = useI18n()
  const me = useMe()

  // The form starts from the loaded profile, so it is only shown once the profile has arrived.
  if (me.isError)
    return (
      <SectionCard title={t('acct.profileTitle')} description={t('acct.profileDesc')} icon={<UserIcon />}>
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {t('acct.profileLoadFailed')}
        </p>
        <button type="button" onClick={() => void me.refetch()} className={`${outlineButton} mt-3`}>
          {t('dash.retry')}
        </button>
      </SectionCard>
    )
  if (!me.data)
    return (
      <SectionCard title={t('acct.profileTitle')} description={t('acct.profileDesc')} icon={<UserIcon />}>
        <p role="status" className="text-sm text-muted">
          {t('acct.profileLoading')}
        </p>
      </SectionCard>
    )
  return <ProfileForm />
}

function ProfileForm() {
  const { t } = useI18n()
  const { notify } = useToast()
  const me = useMe().data
  const update = useUpdateProfile()
  const profile = useProfile()
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
    reader.onload = () => setAvatar(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const save = (e: SubmitEvent) => {
    e.preventDefault()
    const error = validateName(name)
    setNameError(error)
    if (error) return
    if (!me || update.isPending) return
    const fullname = name.trim()
    // The API stores a name and an avatar URL, with no photo upload yet: the phone and the avatar URL are sent back
    // unchanged, and a photo picked here only shows on this device.
    update.mutate(
      { fullname, phone: me.phone, avatar: me.avatar },
      {
        onSuccess: () => {
          if (avatar !== profile.avatarUrl) useProfileStore.getState().update({ avatarUrl: avatar })
          setName(fullname)
          notify({ variant: 'info', title: t('acct.profileSaved'), subtitle: t('acct.profileSavedDesc') })
        },
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors.fullname) setNameError('acct.errName')
          else notify({
            variant: 'danger',
            title: t('acct.saveFailed'),
            subtitle: t(error instanceof ApiError ? error.messageKey : 'errors.generic'),
          })
        },
      },
    )
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
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!dirty || update.isPending}>
            {t('acct.save')}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}
