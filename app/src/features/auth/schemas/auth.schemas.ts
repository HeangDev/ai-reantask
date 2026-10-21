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

/** Token answer of `POST /auth/login`; the user comes from a second call (`GET /users/me`). */
export const tokenEnvelope = z.object({
  data: z.object({ accessToken: z.string(), tokenType: z.string(), expiresIn: z.number() }),
})

/** A user as the API returns it (`UserResponse`), mapped to the shape the app uses. */
export const apiUserSchema = z
  .object({
    id: z.number(),
    roleId: z.number(),
    roleName: z
      .string()
      .transform((name) => name.toLowerCase())
      .pipe(z.enum(roles)),
    fullname: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    avatar: z.string().nullable(),
    status: z.string(),
    createdAt: z.string(),
  })
  .transform(
    (u): z.infer<typeof authUserSchema> => ({
      id: u.id,
      fullname: u.fullname,
      // The API has no username; it is the part of the email before the @.
      username: u.email.split('@')[0] ?? u.email,
      email: u.email,
      phone: u.phone,
      avatar: u.avatar,
      status: u.status,
      created_at: u.createdAt,
      role: { id: u.roleId, name: u.roleName },
    }),
  )
export const apiUserEnvelope = z.object({ data: apiUserSchema })

export const authUserEnvelope =z.object({ data: authUserSchema })
export const authResultEnvelope = z.object({ data: authResultSchema })
/** A known, approved Google account gets a token (AuthResult); a first-time Google user is created PENDING and gets none (AuthUser). */
export const googleEnvelope = z.object({
  data: z.object({
    token: z.object({ accessToken: z.string(), tokenType: z.string(), expiresIn: z.number() }).optional(),
    user: apiUserSchema,
  }),
})
export const messageSchema = z.object({ message: z.string() })

export type AuthUser = z.infer<typeof authUserSchema>
export type AuthResult = z.infer<typeof authResultSchema>
