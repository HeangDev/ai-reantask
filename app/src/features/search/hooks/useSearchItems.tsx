import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { integrationNavItem, navItemsFor } from '@/components/layout/navItems'
import { AssignmentsIcon, GlobeIcon, MoonIcon, SettingsIcon, SunIcon, TasksIcon } from '@/components/ui/icons'
import { useAssignments } from '@/features/assignments/store/assignmentsStore'
import { useSession } from '@/features/auth/store/authStore'
import { useClassNameScope } from '@/features/classes/hooks/useVisibleClasses'
import type { SearchItem } from '@/features/search/types'
import { sampleTasks } from '@/features/tasks/data/sampleTasks'
import { useTheme } from '@/hooks/useTheme'
import { languageNames, useI18n } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'

/** Builds everything the global search can find. Selecting an item closes the search, then runs it. */
export function useSearchItems(close: () => void): SearchItem[] {
  const { t, language, setLanguage } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const assignmentList = useAssignments()
  const role = useSession()?.role
  const classScope = useClassNameScope()

  return useMemo(() => {
    const go = (to: string) => () => {
      close()
      navigate(to)
    }
    const run = (action: () => void) => () => {
      close()
      action()
    }

    const pages: SearchItem[] = [
      ...[...navItemsFor(role), ...(role && integrationNavItem.roles.includes(role) ? [integrationNavItem] : [])].map((n) => ({
        id: `page:${n.to}`,
        group: 'pages' as const,
        label: t(n.labelKey),
        icon: n.icon,
        keywords: n.to.slice(1),
        onSelect: go(n.to),
      })),
      {
        id: 'page:/settings',
        group: 'pages',
        label: t('nav.settings'),
        icon: <SettingsIcon />,
        keywords: `settings ${t('settings.appearance')} ${t('settings.accent')} color ${t('header.language')}`,
        onSelect: go('/settings'),
      },
    ]

    // Admins do not work with assignments, so they are not searchable for them.
    const assignments: SearchItem[] = (role === 'admin' ? [] : assignmentList.filter((a) => !classScope || classScope.has(a.className))).map((a) => ({
      id: `assignment:${a.id}`,
      group: 'assignments',
      label: a.title,
      description: `${a.className} · ${t(`status.${a.status}` as const)}`,
      icon: <AssignmentsIcon />,
      keywords: [a.description, a.feedback, a.submittedFile, a.allowedFileTypes.join(' ')].filter(Boolean).join(' '),
      onSelect: go(role === 'teacher' ? '/assign' : `/assignments?q=${encodeURIComponent(a.title)}`),
    }))

    const tasks: SearchItem[] = sampleTasks.map((task) => ({
      id: `task:${task.id}`,
      group: 'tasks',
      label: task.title,
      description: t('nav.tasks'),
      icon: <TasksIcon />,
      keywords: '',
      onSelect: go('/tasks'),
    }))

    const languageActions: SearchItem[] = (Object.keys(languageNames) as Language[])
      .filter((code) => code !== language)
      .map((code) => ({
        id: `action:language:${code}`,
        group: 'actions',
        label: t('search.toLanguage', { language: languageNames[code] }),
        icon: <GlobeIcon />,
        keywords: 'language english khmer korean',
        onSelect: run(() => setLanguage(code)),
      }))
    const actions: SearchItem[] = [
      {
        id: 'action:theme',
        group: 'actions',
        label: theme === 'dark' ? t('header.lightMode') : t('header.darkMode'),
        icon: theme === 'dark' ? <SunIcon /> : <MoonIcon />,
        keywords: 'theme dark light mode appearance',
        onSelect: run(toggleTheme),
      },
      ...languageActions,
    ]

    return [...pages, ...assignments, ...tasks, ...actions]
  }, [t, language, setLanguage, theme, toggleTheme, navigate, close, assignmentList, role, classScope])
}
