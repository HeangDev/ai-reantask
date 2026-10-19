import { QueryClient } from '@tanstack/react-query'
import { isClientError } from '@/shared/api/errors'

// Defaults from state-management.md §3; 4xx errors are never retried.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: 0 },
  },
})
