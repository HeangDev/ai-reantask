import { CLASS_CODE_LENGTH, normalizeClassCode } from '@/features/classes/lib/classCode'
import type { SchoolClass } from '@/features/classes/types'
import type { TranslationKey } from '@/lib/i18n'

export type JoinResult = { ok: true; schoolClass: SchoolClass } | { ok: false; error: TranslationKey }

/** Checks a typed class code: right length, belongs to an active class, and not joined or already requested. */
export function checkJoinCode(
  input: string,
  classes: SchoolClass[],
  joined: ReadonlySet<string>,
  pending: ReadonlySet<string>,
): JoinResult {
  const code = normalizeClassCode(input)
  if (code.length !== CLASS_CODE_LENGTH) return { ok: false, error: 'join.errCode' }

  const found = classes.find((c) => c.code === code && c.status === 'active')
  if (!found) return { ok: false, error: 'join.errNotFound' }
  if (joined.has(found.id)) return { ok: false, error: 'join.errAlready' }
  if (pending.has(found.id)) return { ok: false, error: 'join.errPending' }

  return { ok: true, schoolClass: found }
}
