import { z } from 'zod'
import { roles } from '@/shared/types/auth'

export const authUserSchema = z.object({
  id: z.number(),
  fullname: z.string(),
  username: z.string(),
  email: z.string(),
  /** Null for an account created with Google, which shares no phone number. */
  phone: z.string().nullable(),
  avatar: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  role: z.object({ id: z.number(), name: z.enum(roles) }),
})

export const authResultSchema = z.object({
  token: z.string(),
  token_type: z.string(),
  expires_at: z.string().nullable(),
  user: authUserSchema,
})

export const authUserEnvelope = z.object({ data: authUserSchema })
export const authResultEnvelope = z.object({ data: authResultSchema })
/** A known, approved Google account gets a token (AuthResult); a first-time Google user is created PENDING and gets none (AuthUser). */
export const googleEnvelope = z.object({ data: z.union([authResultSchema, authUserSchema]) })
export const messageSchema = z.object({ message: z.string() })

export type AuthUser = z.infer<typeof authUserSchema>
export type AuthResult = z.infer<typeof authResultSchema>
