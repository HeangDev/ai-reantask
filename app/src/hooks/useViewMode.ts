import { useState } from 'react'
import type { ViewMode } from '@/components/ui/ViewSwitch'

/** The chosen view is a per-viewer convenience; storage can be blocked, so it is always optional. */
export function useViewMode(storageKey: string): [ViewMode, (view: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(storageKey) === 'table' ? 'table' : 'grid'
    } catch {
      return 'grid'
    }
  })

  const choose = (next: ViewMode) => {
    setView(next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      // Not remembering the view is fine.
    }
  }

  return [view, choose]
}
