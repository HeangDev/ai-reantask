const hasLetterAndNumber = (value: string) => /[A-Za-z]/.test(value) && /\d/.test(value)

/** At least 8 characters with a letter and a number. */
export const isAcceptablePassword = (value: string) => value.length >= 8 && hasLetterAndNumber(value)

/** A six-digit authenticator code. */
export const isValidCode = (code: string) => /^\d{6}$/.test(code)
