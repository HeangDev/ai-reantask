import { isValidEmail } from '@/shared/lib/validation'

export interface ParsedEmails {
  /** Valid, lower-case, without repeats, and not in `skip`. */
  valid: string[]
  /** Text that is not an email address. */
  invalid: string[]
  /** Valid addresses that were already in `skip`. */
  duplicates: string[]
}

/** Splits pasted or typed text on commas, semicolons and whitespace and sorts the pieces into usable and not. */
export function parseEmails(text: string, skip: ReadonlySet<string> = new Set()): ParsedEmails {
  const result: ParsedEmails = { valid: [], invalid: [], duplicates: [] }
  const seen = new Set(skip)

  for (const piece of text.split(/[\s,;]+/)) {
    const email = piece.trim().toLowerCase()
    if (!email) continue
    if (!isValidEmail(email)) result.invalid.push(piece.trim())
    else if (seen.has(email)) result.duplicates.push(email)
    else {
      seen.add(email)
      result.valid.push(email)
    }
  }
  return result
}
