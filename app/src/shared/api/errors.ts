import type { TranslationKey } from '@/shared/i18n'

/** API error body: `{ code, message, errors?: [{ field, message }] }`; the older `{ field: [messages] }` map is still read. */
export interface ErrorBody {
  message?: string
  code?: string
  errors?: { field: string; message: string }[] | Record<string, string[]>
}

/** Normalizes either error shape to `{ field: [messages] }`. */
export function toFieldErrors(errors: ErrorBody['errors']): Record<string, string[]> {
  if (!errors) return {}
  if (!Array.isArray(errors)) return errors
  const result: Record<string, string[]> = {}
  for (const { field, message } of errors) (result[field] ??= []).push(message)
  return result
}

const MESSAGE_KEYS: Record<number, TranslationKey> = {
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  409: 'errors.conflict',
  413: 'errors.fileTooLarge',
  422: 'errors.validation',
  429: 'errors.rateLimited',
}

/** Maps a status to the i18n key the UI shows; server messages are never shown (error-handling.md §2). */
export function messageKeyFor(status: number): TranslationKey {
  if (status === 0) return 'errors.network'
  return MESSAGE_KEYS[status] ?? (status >= 500 ? 'errors.server' : 'errors.generic')
}

/** The normalized error every API failure becomes (api-integration.md §1). */
export class ApiError extends Error {
  readonly status: number
  /** The API's error code, such as ACCOUNT_PENDING, or NETWORK / INVALID_RESPONSE for client-side failures. */
  readonly code?: string
  readonly messageKey: TranslationKey
  readonly fieldErrors: Record<string, string[]>
  readonly requestId?: string
  /** Seconds to wait before retrying, from `Retry-After` on a 429. */
  readonly retryAfter?: number

  constructor(
    status: number,
    options: {
      message?: string
      code?: string
      fieldErrors?: Record<string, string[]>
      requestId?: string
      retryAfter?: number
    } = {},
  ) {
    super(options.message ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = options.code
    this.messageKey = messageKeyFor(status)
    this.fieldErrors = options.fieldErrors ?? {}
    this.requestId = options.requestId
    this.retryAfter = options.retryAfter
  }
}

export const isClientError = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500
