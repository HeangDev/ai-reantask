import { z } from 'zod'

const DEFAULT_API_URL = 'http://localhost:8000'

const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .optional()
    .transform((value) => value?.trim() || DEFAULT_API_URL),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_GOOGLE_CLIENT_ID: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
})

// The only place that reads import.meta.env (architecture.md §8); validated once at startup.
export const env = envSchema.parse(import.meta.env)
