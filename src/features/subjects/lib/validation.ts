import type { Subject, SubjectFormErrors, SubjectInput } from '@/features/subjects/types'
import { MAX_DESCRIPTION_LENGTH } from '@/lib/validation'

/** Client-side rules: a name that no other subject uses, and a description that is not too long. */
export function validateSubject(input: SubjectInput, others: Subject[]): SubjectFormErrors {
  const errors: SubjectFormErrors = {}
  const name = input.name.trim().toLowerCase()

  if (!name) errors.name = 'sub.errName'
  else if (others.some((s) => s.name.trim().toLowerCase() === name)) errors.name = 'sub.errNameTaken'
  if (input.description.trim().length > MAX_DESCRIPTION_LENGTH) errors.description = 'form.errDescription'

  return errors
}
