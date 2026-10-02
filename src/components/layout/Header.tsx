import { useCallback, useEffect, useState } from 'react'
import IntegrationStatus from '@/components/layout/IntegrationStatus'
import NotificationMenu from '@/components/layout/NotificationMenu'
import ProfileMenu from '@/components/layout/ProfileMenu'
import { SearchIcon } from '@/components/ui/icons'
import { useSession } from '@/features/auth/store/authStore'
import CommandPalette from '@/features/search/components/CommandPalette'
import { useI18n } from '@/lib/i18n'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export default function Header() {
  const { t } = useI18n()
  const role = useSession()?.role
  const [searchOpen, setSearchOpen] = useState(false)
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  // Ctrl/⌘ + K opens the global search from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-haspopup="dialog"
        aria-label={t('header.search')}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-sunken text-sm sm:w-full sm:max-w-md sm:justify-start sm:gap-2.5 sm:px-3 text-muted transition-colors hover:border-accent/50 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      >
        <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true"><SearchIcon /></span>
        <span className="hidden min-w-0 flex-1 truncate text-left sm:block">{t('header.search')}</span>
        <kbd className="hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium sm:block" aria-hidden="true">
          {isMac ? '⌘ K' : 'Ctrl K'}
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        {role === 'teacher' && <IntegrationStatus />}
        <NotificationMenu />
        <span className="h-5 w-px bg-line" aria-hidden="true" />
        <ProfileMenu />
      </div>

      {searchOpen && <CommandPalette onClose={closeSearch} />}
    </header>
  )
}
