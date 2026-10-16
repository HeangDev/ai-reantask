import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSubject, deleteSubject, fetchSubjects, updateSubject } from '@/features/subjects/services/subjectsService'
import type { Subject } from '@/features/subjects/types'

const EMPTY: Subject[] = []

/** The subjects query, for pages that show loading and error states. */
export const useSubjectsQuery = () => useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects, staleTime: 60_000 })

/** Just the subjects (empty until loaded), for the pickers and counts that need only the list. */
export const useSubjects = (): Subject[] => useSubjectsQuery().data ?? EMPTY

function useRefreshSubjects() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['subjects'] })
}

export function useCreateSubject() {
  const refresh = useRefreshSubjects()
  return useMutation({ mutationFn: createSubject, onSuccess: refresh })
}

export function useUpdateSubject() {
  const refresh = useRefreshSubjects()
  return useMutation({ mutationFn: updateSubject, onSuccess: refresh })
}

/** Deletes every id; if some fail the others are still deleted and the mutation reports an error. */
export function useDeleteSubjects() {
  const refresh = useRefreshSubjects()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map(deleteSubject))
      const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (failed) throw failed.reason
    },
    onSettled: refresh,
  })
}
