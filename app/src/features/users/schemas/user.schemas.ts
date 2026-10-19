import { z } from 'zod'
import { authUserSchema } from '@/features/auth'
import { roles } from '@/shared/types/auth'

export const usersPageSchema = z.object({
  data: z.array(authUserSchema),
  meta: z.object({ total: z.number() }),
})

export const usersListSchema = z.object({ data: z.array(authUserSchema) })
export const userEnvelope = z.object({ data: authUserSchema })

export const rolesSchema = z.object({
  data: z.array(z.object({ id: z.number(), name: z.enum(roles), status: z.string() })),
})
