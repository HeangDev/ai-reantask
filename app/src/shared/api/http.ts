import type { z } from 'zod'
import { env } from '@/shared/config/env'
import { ApiError } from '@/shared/api/errors'
import { toFieldErrors } from '@/shared/api/errors'
import type { ErrorBody } from '@/shared/api/errors'
import { authActions, getSession } from '@/shared/store/authStore'

export { ApiError } from '@/shared/api/errors'

const BASE_URL = env.VITE_API_URL
const TIMEOUT_MS = 30_000

interface RequestOptions<S extends z.ZodType | undefined> {
  method?: string
  body?: unknown
  /** Overrides the signed-in session's token (used right after login). */
  token?: string
  /** Query parameters; empty values are skipped. */
  params?: Record<string, string | number | boolean | undefined | null>
  signal?: AbortSignal
  /** Every response body is parsed with this schema (api-integration.md §2). */
  schema?: S
}

function withTimeout(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

function buildQuery(params: RequestOptions<undefined>['params']) {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ''
}

/**
 * Calls the API and returns the body parsed with `schema`. A failure is always an `ApiError`; a 401 on a
 * signed-in request ends the session (the frontend never refreshes tokens: the API issues none).
 */
export async function apiRequest<S extends z.ZodType>(
  path: string,
  options: RequestOptions<S> & { schema: S },
): Promise<z.output<S>>
export async function apiRequest(path: string, options?: RequestOptions<undefined>): Promise<void>
export async function apiRequest(path: string, options: RequestOptions<z.ZodType | undefined> = {}): Promise<unknown> {
  const { method = 'GET', body, params, signal, schema } = options
  const token = options.token ?? getSession()?.token

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/api/v1${path}${buildQuery(params)}`, {
      method,
      signal: withTimeout(signal),
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(0, { code: 'NETWORK' })
  }

  const requestId = response.headers.get('X-Request-Id') ?? undefined
  if (response.status === 204) return undefined

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const errorBody = (data ?? {}) as ErrorBody
    // A rejected token ends the session; a failed login attempt (no token sent) is a normal error.
    if (response.status === 401 && token) authActions.signOut()
    throw new ApiError(response.status, {
      message: errorBody.message,
      code: errorBody.code,
      fieldErrors: toFieldErrors(errorBody.errors),
      requestId,
      retryAfter: Number(response.headers.get('Retry-After')) || undefined,
    })
  }

  if (!schema) return undefined
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new ApiError(response.status, { code: 'INVALID_RESPONSE', requestId })
  return parsed.data
}
