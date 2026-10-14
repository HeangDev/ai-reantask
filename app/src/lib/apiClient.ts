const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

/** Laravel error body: `{ message, errors?: { field: [messages] } }` (api docs, section 6). */
interface ErrorBody {
  message?: string
  code?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>
  /** The API's error code, such as ACCOUNT_PENDING, when it sent one. */
  readonly code?: string

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.code = code
  }
}

export async function apiRequest<T>(path: string, options: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const { method = 'GET', body, token } = options
  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return undefined as T
  const data = (await response.json().catch(() => null)) as (T & ErrorBody) | null
  if (!response.ok) throw new ApiError(response.status, data?.message ?? response.statusText, data?.errors, data?.code)
  return data as T
}
