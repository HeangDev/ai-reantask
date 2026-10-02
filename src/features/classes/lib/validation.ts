import type { ClassFormErrors, ClassInput, SchoolClass } from '@/features/classes/types'
import { MAX_DESCRIPTION_LENGTH } from '@/lib/validation'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Client-side rules: the name is required and unique among the other classes. */
export function validateClass(input: ClassInput, others: SchoolClass[]): ClassFormErrors {
  const errors: ClassFormErrors = {}
  const name = input.name.trim().toLowerCase()

  if (!name) errors.name = 'cls.errName'
  else if (others.some((c) => c.name.trim().toLowerCase() === name)) errors.name = 'cls.errNameTaken'
  if (!ISO_DATE.test(input.startDate)) errors.startDate = 'cls.errStartDate'
  if (!ISO_DATE.test(input.endDate)) errors.endDate = 'cls.errEndDate'
  else if (!errors.startDate && input.endDate < input.startDate) errors.endDate = 'cls.errEndBefore'
  if (input.description.trim().length > MAX_DESCRIPTION_LENGTH) errors.description = 'form.errDescription'

  return errors
}
