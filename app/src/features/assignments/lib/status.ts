import type { Assignment } from '@/features/assignments/types'

/** The student still has something to do: submit, resubmit, or catch up on a late one. */
export const needsAction = (a: Assignment) => a.status === 'pending' || a.status === 'late' || a.status === 'resubmit'
