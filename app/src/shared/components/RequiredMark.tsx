// A symbol, not user-facing text, so it is not translated.
const ASTERISK = '*'

/** A red asterisk after a label, for a field that must be filled in. Hidden from screen readers; the error message tells them when a field is missing. */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-red-600 dark:text-red-400">
      {ASTERISK}
    </span>
  )
}
