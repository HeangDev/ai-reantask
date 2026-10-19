import { z } from 'zod'

const activeStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])

export const apiClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  status: activeStatusSchema,
  start_at: z.string(),
  end_date: z.string(),
})

export const classEnvelope = z.object({ data: apiClassSchema })
export const classesPageSchema = z.object({
  data: z.array(apiClassSchema),
  meta: z.object({ last_page: z.number() }),
})

export type ApiClass = z.infer<typeof apiClassSchema>
