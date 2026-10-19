import type { Subject, SubjectInput } from '@/features/subjects/types'
import { subjectEnvelope, subjectsPageSchema } from '@/features/subjects/schemas/subject.schemas'
import type { ApiSubject } from '@/features/subjects/schemas/subject.schemas'
import { apiRequest } from '@/shared/api/http'

const PER_PAGE = 100

const toSubject = (s: ApiSubject): Subject => ({
  id: String(s.id),
  name: s.name,
  description: s.description ?? '',
  status: s.status === 'ACTIVE' ? 'active' : 'inactive',
})

const toBody = (input: Partial<SubjectInput>) => ({
  ...(input.name !== undefined && { name: input.name }),
  ...(input.description !== undefined && { description: input.description }),
  ...(input.status !== undefined && { status: input.status === 'active' ? 'ACTIVE' : 'INACTIVE' }),
})

/**
 * Every subject the user may see, by name. The page and the subject pickers filter and count locally,
 * so all pages are loaded (the API allows at most 100 per page). Non-admins get ACTIVE subjects only.
 */
export async function fetchSubjects(signal?: AbortSignal): Promise<Subject[]> {
  const subjects: Subject[] = []
  let page = 1
  let lastPage = 1
  do {
    const result = await apiRequest('/subjects', {
      params: { per_page: PER_PAGE, page, sort: 'name' },
      signal,
      schema: subjectsPageSchema,
    })
    subjects.push(...result.data.map(toSubject))
    lastPage = result.meta.last_page
    page += 1
  } while (page <= lastPage)
  return subjects
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const { data } = await apiRequest('/subjects', { method: 'POST', body: toBody(input), schema: subjectEnvelope })
  return toSubject(data)
}

export async function updateSubject({ id, changes }: { id: string; changes: Partial<SubjectInput> }): Promise<Subject> {
  const { data } = await apiRequest(`/subjects/${id}`, { method: 'PATCH', body: toBody(changes), schema: subjectEnvelope })
  return toSubject(data)
}

export const deleteSubject = (id: string) => apiRequest(`/subjects/${id}`, { method: 'DELETE' })
