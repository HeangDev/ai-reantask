import type { ReactNode } from 'react'

export type SearchGroup = 'pages' | 'assignments' | 'tasks' | 'actions'

export interface SearchItem {
  id: string
  group: SearchGroup
  label: string
  description?: string
  icon: ReactNode
  /** Extra text that makes the item findable without being displayed. */
  keywords: string
  onSelect: () => void
}
