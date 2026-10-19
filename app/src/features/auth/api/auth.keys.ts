export const authKeys = {
  all: ['auth'] as const,
  me: (token: string | undefined) => [...authKeys.all, 'me', token] as const,
}
