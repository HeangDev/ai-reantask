import type { ClassInput, SchoolClass } from '@/features/classes/types'
import { classEnvelope, classesPageSchema } from '@/features/classes/schemas/class.schemas'
import type { ApiClass } from '@/features/classes/schemas/class.schemas'
import { sampleClasses } from '@/features/classes/data/sampleClasses'
import { apiRequest } from '@/shared/api/http'
import { usesSampleClasses } from '@/shared/config/mockMode'

const PAGE_SIZE = 100

const toClass = (c: ApiClass): SchoolClass => ({
  id: String(c.id),
  name: c.name,
  description: c.description ?? '',
  startDate: c.startAt,
  endDate: c.endDate,
  status: c.status === 'ACTIVE' ? 'active' : 'inactive',
  code: c.code,
})

const toApiStatus = (status: SchoolClass['status']) => (status === 'active' ? 'ACTIVE' : 'INACTIVE')

/**
 * Every class the user may see, by name. The page and the class pickers filter locally, so all pages are loaded
 * (the API allows at most 100 per page).
 */
export async function fetchClasses(signal?: AbortSignal): Promise<SchoolClass[]> {
  // Sample classes for a teacher (and in mock mode): read-only, no API call.
  if (usesSampleClasses()) return sampleClasses
  const classes: SchoolClass[] = []
  let page = 0 // the API's pages start at 0
  let totalPages = 1
  do {
    const { data } = await apiRequest('/classes', {
      params: { size: PAGE_SIZE, page, sort: 'name,asc' },
      signal,
      schema: classesPageSchema,
    })
    classes.push(...data.items.map(toClass))
    totalPages = data.totalPages
    page += 1
  } while (page < totalPages)
  return classes
}

/** Create and update take no status, so it is set through its own endpoint. */
const setStatus = async (id: string, status: SchoolClass['status']): Promise<SchoolClass> => {
  const { data } = await apiRequest(`/classes/${id}/status`, {
    method: 'PATCH',
    body: { status: toApiStatus(status) },
    schema: classEnvelope,
  })
  return toClass(data)
}

const toBody = (input: Omit<ClassInput, 'status'>) => ({
  name: input.name,
  description: input.description,
  startAt: input.startDate,
  endDate: input.endDate,
})

/** The API generates the join code and creates every class as ACTIVE; an inactive one is switched right after. */
export async function createClass(input: ClassInput): Promise<SchoolClass> {
  const { data } = await apiRequest('/classes', { method: 'POST', body: toBody(input), schema: classEnvelope })
  const created = toClass(data)
  return input.status === 'inactive' ? setStatus(created.id, input.status) : created
}

/**
 * Edits the details (one call, needs all four fields) and the status (another call); either may be left out of
 * `changes`, as the active toggle on a card sends only the status.
 */
export async function updateClass({ id, changes }: { id: string; changes: Partial<ClassInput> }): Promise<SchoolClass> {
  let schoolClass: SchoolClass | undefined
  const { name, description, startDate, endDate, status } = changes
  if (name !== undefined && startDate !== undefined && endDate !== undefined) {
    const { data } = await apiRequest(`/classes/${id}`, {
      method: 'PUT',
      body: toBody({ name, description: description ?? '', startDate, endDate }),
      schema: classEnvelope,
    })
    schoolClass = toClass(data)
  }
  if (status !== undefined) schoolClass = await setStatus(id, status)
  if (!schoolClass) throw new Error('updateClass needs the class details or a status')
  return schoolClass
}

export const deleteClass = (id: string) => apiRequest(`/classes/${id}`, { method: 'DELETE' })
