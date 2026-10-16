import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClass, deleteClass, fetchClasses, updateClass } from '@/features/classes/services/classesService'
import type { SchoolClass } from '@/features/classes/types'

const EMPTY: SchoolClass[] = []

/** The classes query, for pages that show loading and error states. */
export const useClassesQuery = () => useQuery({ queryKey: ['classes'], queryFn: fetchClasses, staleTime: 60_000 })

/** Just the classes (empty until loaded), for the pickers and counts that need only the list. */
export const useClasses = (): SchoolClass[] => useClassesQuery().data ?? EMPTY

function useRefreshClasses() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['classes'] })
}

export function useCreateClass() {
  const refresh = useRefreshClasses()
  return useMutation({ mutationFn: createClass, onSuccess: refresh })
}

export function useUpdateClass() {
  const refresh = useRefreshClasses()
  return useMutation({ mutationFn: updateClass, onSuccess: refresh })
}

/** Deletes every id; if some fail the others are still deleted and the mutation reports an error. */
export function useDeleteClasses() {
  const refresh = useRefreshClasses()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map(deleteClass))
      const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (failed) throw failed.reason
    },
    onSettled: refresh,
  })
}
