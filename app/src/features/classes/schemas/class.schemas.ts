import { z } from 'zod'

const activeStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])

export const apiClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  status: activeStatusSchema,
  startAt: z.string(),
  endDate: z.string(),
})

export const classEnvelope = z.object({ data: apiClassSchema })
/** A page as the API sends it: `{ items, page, size, totalItems, totalPages }`. */
export const classesPageSchema = z.object({
  data: z.object({ items: z.array(apiClassSchema), totalPages: z.number() }),
})

export type ApiClass = z.infer<typeof apiClassSchema>
