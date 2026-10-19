import { z } from 'zod'

export const sessionsSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      device_name: z.string(),
      is_current: z.boolean(),
      last_used_at: z.string().nullable(),
      expires_at: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
})
