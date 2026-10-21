import type { Subject, SubjectInput } from '@/features/subjects/types'
import { subjectEnvelope, subjectsPageSchema } from '@/features/subjects/schemas/subject.schemas'
import type { ApiSubject } from '@/features/subjects/schemas/subject.schemas'
import { apiRequest } from '@/shared/api/http'

const PAGE_SIZE = 100

const toSubject = (s: ApiSubject): Subject => ({
  id: String(s.id),
  name: s.name,
  description: s.description ?? '',
  status: s.status === 'ACTIVE' ? 'active' : 'inactive',
})

const toApiStatus = (status: Subject['status']) => (status === 'active' ? 'ACTIVE' : 'INACTIVE')

/**
 * Every subject the user may see, by name. The page and the subject pickers filter and count locally,
 * so all pages are loaded (the API allows at most 100 per page).
 */
export async function fetchSubjects(signal?: AbortSignal): Promise<Subject[]> {
  const subjects: Subject[] = []
  let page = 0 // the API's pages start at 0
  let totalPages = 1
  do {
    const { data } = await apiRequest('/subjects', {
      params: { size: PAGE_SIZE, page, sort: 'name,asc' },
      signal,
      schema: subjectsPageSchema,
    })
    subjects.push(...data.items.map(toSubject))
    totalPages = data.totalPages
    page += 1
  } while (page < totalPages)
  return subjects
}

/** Create and update take no status, so it is set through its own endpoint. */
const setStatus = async (id: string, status: Subject['status']): Promise<Subject> => {
  const { data } = await apiRequest(`/subjects/${id}/status`, {
    method: 'PATCH',
    body: { status: toApiStatus(status) },
    schema: subjectEnvelope,
  })
  return toSubject(data)
}

/** The API creates every subject as ACTIVE; an inactive one is switched right after. */
export async function createSubject(input: SubjectInput): Promise<Subject> {
  const { data } = await apiRequest('/subjects', {
    method: 'POST',
    body: { name: input.name, description: input.description },
    schema: subjectEnvelope,
  })
  const created = toSubject(data)
  return input.status === 'inactive' ? setStatus(created.id, input.status) : created
}

/** Edits the name and description (one call) and the status (another); either may be left out of `changes`. */
export async function updateSubject({ id, changes }: { id: string; changes: Partial<SubjectInput> }): Promise<Subject> {
  let subject: Subject | undefined
  if (changes.name !== undefined) {
    const { data } = await apiRequest(`/subjects/${id}`, {
      method: 'PUT',
      body: { name: changes.name, description: changes.description ?? '' },
      schema: subjectEnvelope,
    })
    subject = toSubject(data)
  }
  if (changes.status !== undefined) subject = await setStatus(id, changes.status)
  if (!subject) throw new Error('updateSubject needs a name or a status')
  return subject
}

export const deleteSubject = (id: string) => apiRequest(`/subjects/${id}`, { method: 'DELETE' })
