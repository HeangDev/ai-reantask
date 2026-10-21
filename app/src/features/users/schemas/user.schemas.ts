import { z } from 'zod'
import { apiUserEnvelope, apiUserSchema } from '@/features/auth'
import { roles } from '@/shared/types/auth'

/** A page as the API sends it: `{ items, page, size, totalItems, totalPages }`. */
export const usersPageSchema = z.object({
  data: z.object({ items: z.array(apiUserSchema), totalItems: z.number() }),
})

export const userEnvelope = apiUserEnvelope

export const rolesSchema = z.object({
  data: z.object({
    items: z.array(
      z.object({
        id: z.number(),
        name: z
          .string()
          .transform((name) => name.toLowerCase())
          .pipe(z.enum(roles)),
        status: z.string(),
      }),
    ),
  }),
})
