import type { ClassInput, SchoolClass } from '@/features/classes/types'
import { classEnvelope, classesPageSchema } from '@/features/classes/schemas/class.schemas'
import type { ApiClass } from '@/features/classes/schemas/class.schemas'
import { apiRequest } from '@/shared/api/http'

const PER_PAGE = 100

const toClass = (c: ApiClass): SchoolClass => ({
  id: String(c.id),
  name: c.name,
  description: c.description ?? '',
  startDate: c.start_at,
  endDate: c.end_date,
  status: c.status === 'ACTIVE' ? 'active' : 'inactive',
  code: c.code,
})

const toBody = (input: Partial<ClassInput>) => ({
  ...(input.name !== undefined && { name: input.name }),
  ...(input.description !== undefined && { description: input.description }),
  ...(input.startDate !== undefined && { start_at: input.startDate }),
  ...(input.endDate !== undefined && { end_date: input.endDate }),
  ...(input.status !== undefined && { status: input.status === 'active' ? 'ACTIVE' : 'INACTIVE' }),
})

/**
 * Every class the user may see, by name. The API already limits non-admins to their own classes. The page and
 * the class pickers filter locally, so all pages are loaded (the API allows at most 100 per page).
 */
export async function fetchClasses(signal?: AbortSignal): Promise<SchoolClass[]> {
  const classes: SchoolClass[] = []
  let page = 1
  let lastPage = 1
  do {
    const result = await apiRequest('/classes', {
      params: { per_page: PER_PAGE, page, sort: 'name' },
      signal,
      schema: classesPageSchema,
    })
    classes.push(...result.data.map(toClass))
    lastPage = result.meta.last_page
    page += 1
  } while (page <= lastPage)
  return classes
}

export async function createClass(input: ClassInput): Promise<SchoolClass> {
  const { data } = await apiRequest('/classes', { method: 'POST', body: toBody(input), schema: classEnvelope })
  return toClass(data)
}

export async function updateClass({ id, changes }: { id: string; changes: Partial<ClassInput> }): Promise<SchoolClass> {
  const { data } = await apiRequest(`/classes/${id}`, { method: 'PATCH', body: toBody(changes), schema: classEnvelope })
  return toClass(data)
}

export const deleteClass = (id: string) => apiRequest(`/classes/${id}`, { method: 'DELETE' })
