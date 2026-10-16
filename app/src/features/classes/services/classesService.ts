import { getSession } from '@/features/auth/store/authStore'
import type { ClassInput, SchoolClass } from '@/features/classes/types'
import { apiRequest } from '@/lib/apiClient'

interface ApiClass {
  id: number
  name: string
  code: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
  start_at: string
  end_date: string
}

interface ApiClassesPage {
  data: ApiClass[]
  meta: { last_page: number }
}

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

const token = () => getSession()?.token

/**
 * Every class the user may see, by name. The API already limits non-admins to their own classes. The page and
 * the class pickers filter locally, so all pages are loaded (the API allows at most 100 per page).
 */
export async function fetchClasses(): Promise<SchoolClass[]> {
  const classes: SchoolClass[] = []
  let page = 1
  let lastPage = 1
  do {
    const params = new URLSearchParams({ per_page: String(PER_PAGE), page: String(page), sort: 'name' })
    const result = await apiRequest<ApiClassesPage>(`/classes?${params}`, { token: token() })
    classes.push(...result.data.map(toClass))
    lastPage = result.meta.last_page
    page += 1
  } while (page <= lastPage)
  return classes
}

export async function createClass(input: ClassInput): Promise<SchoolClass> {
  const { data } = await apiRequest<{ data: ApiClass }>('/classes', { method: 'POST', token: token(), body: toBody(input) })
  return toClass(data)
}

export async function updateClass({ id, changes }: { id: string; changes: Partial<ClassInput> }): Promise<SchoolClass> {
  const { data } = await apiRequest<{ data: ApiClass }>(`/classes/${id}`, {
    method: 'PATCH',
    token: token(),
    body: toBody(changes),
  })
  return toClass(data)
}

export const deleteClass = (id: string) => apiRequest<void>(`/classes/${id}`, { method: 'DELETE', token: token() })
