import { z } from 'zod'

export const apiSubjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export const subjectEnvelope = z.object({ data: apiSubjectSchema })
/** A page as the API sends it: `{ items, page, size, totalItems, totalPages }`. */
export const subjectsPageSchema = z.object({
  data: z.object({ items: z.array(apiSubjectSchema), totalPages: z.number() }),
})

export type ApiSubject = z.infer<typeof apiSubjectSchema>
