import { useQueries, useQueryClient } from '@tanstack/react-query'
import type { RegistrationStatus } from '@/features/classes/lib/registration'
import { sampleStudents } from '@/features/students/data/sampleStudents'
import { fetchPendingStudents } from '@/features/users/services/usersService'

const STALE_MS = 60_000

/**
 * Whether each email belongs to a registered student; `undefined` while it is still being checked.
 *
 * A teacher cannot search users in the API (listing users is admin-only), so this is a stand-in: an email in the
 * list of students waiting for approval, which a teacher may read, is `pending`; one that matches a local sample
 * student is `registered`; anything else is `unregistered`. Replace the lookup when the API can answer it.
 */
export function useEmailRegistration(emails: string[]): Record<string, RegistrationStatus | undefined> {
  const queryClient = useQueryClient()
  const results = useQueries({
    queries: emails.map((email) => ({
      queryKey: ['email-registration', email],
      staleTime: STALE_MS,
      queryFn: async (): Promise<RegistrationStatus> => {
        const pending = await queryClient
          .fetchQuery({ queryKey: ['users', 'pending'], queryFn: fetchPendingStudents, staleTime: STALE_MS })
          .catch(() => [])
        if (pending.some((u) => u.email.toLowerCase() === email)) return 'pending'
        if (sampleStudents.some((s) => s.email.toLowerCase() === email)) return 'registered'
        return 'unregistered'
      },
    })),
  })
  return Object.fromEntries(emails.map((email, i) => [email, results[i]?.data]))
}
