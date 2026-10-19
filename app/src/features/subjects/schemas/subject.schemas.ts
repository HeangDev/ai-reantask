import { z } from 'zod'

export const apiSubjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export const subjectEnvelope = z.object({ data: apiSubjectSchema })
export const subjectsPageSchema = z.object({
  data: z.array(apiSubjectSchema),
  meta: z.object({ last_page: z.number() }),
})

export type ApiSubject = z.infer<typeof apiSubjectSchema>
