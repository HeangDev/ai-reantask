import { useQuery } from '@tanstack/react-query'
import { queryClient } from '@/shared/api/queryClient'

/**
 * A stand-in for a backend resource that has no API yet (api-integration.md §8).
 *
 * The value lives in TanStack Query like any server data, under a `['mock', name]` key, so screens read it with a
 * normal query hook, it is cleared on logout, and swapping it for a real `*.api.ts` later changes only the
 * resource's module, not its consumers.
 */
export function createMockResource<T>(name: string, initial: T) {
  let db = initial
  const queryKey = ['mock', name] as const

  return {
    queryKey,
    /** The current value, kept in sync across every screen that reads it. */
    useValue: (): T =>
      useQuery({ queryKey, queryFn: () => db, initialData: () => db, staleTime: Number.POSITIVE_INFINITY }).data,
    /** The current value, for code that runs outside a component. */
    get: () => db,
    set: (next: T) => {
      db = next
      queryClient.setQueryData(queryKey, next)
    },
  }
}
