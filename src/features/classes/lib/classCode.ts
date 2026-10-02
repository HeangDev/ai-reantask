// No 0/O or 1/I, which are easy to mix up when a student types the code.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CLASS_CODE_LENGTH = 6

/** A random join code that is not already used by another class. */
export function generateClassCode(existing: ReadonlySet<string>): string {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(CLASS_CODE_LENGTH))
    const code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
    if (!existing.has(code)) return code
  }
}

/** What a student typed, ready to compare: no spaces, upper case. */
export const normalizeClassCode = (input: string) => input.replace(/\s/g, '').toUpperCase()
