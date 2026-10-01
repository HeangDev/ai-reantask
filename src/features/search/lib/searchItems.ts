import type { SearchGroup, SearchItem } from '@/features/search/types'

export const groupOrder: SearchGroup[] = ['pages', 'assignments', 'tasks', 'actions']

const EMPTY_QUERY_LIMITS: Record<SearchGroup, number> = { pages: 8, assignments: 4, tasks: 0, actions: 3 }
const RESULT_LIMIT = 30

export const toTerms = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean)

// Every term must match; label matches rank above keyword matches.
function score(item: SearchItem, terms: string[]): number {
  const label = item.label.toLowerCase()
  const rest = `${item.description ?? ''} ${item.keywords}`.toLowerCase()
  let total = 0
  for (const term of terms) {
    if (label.startsWith(term)) total += 3
    else if (label.includes(term)) total += 2
    else if (rest.includes(term)) total += 1
    else return 0
  }
  return total
}

/** Returns results already ordered the way they are displayed (grouped). */
export function searchItems(items: SearchItem[], query: string): SearchItem[] {
  const terms = toTerms(query)

  if (terms.length === 0) {
    return groupOrder.flatMap((group) => items.filter((i) => i.group === group).slice(0, EMPTY_QUERY_LIMITS[group]))
  }

  const scored = items
    .map((item, index) => ({ item, index, score: score(item, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, RESULT_LIMIT)

  return groupOrder.flatMap((group) => scored.filter((r) => r.item.group === group).map((r) => r.item))
}
