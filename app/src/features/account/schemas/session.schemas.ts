import { z } from 'zod'

/** A page of the signed-in user's active sessions (`GET /users/me/sessions`). */
export const sessionsSchema = z.object({
  data: z.object({
    items: z.array(
      z.object({
        id: z.number(),
        ipAddress: z.string().nullable(),
        userAgent: z.string().nullable(),
        signedInAt: z.string(),
        expiresAt: z.string().nullable(),
        current: z.boolean(),
      }),
    ),
  }),
})
