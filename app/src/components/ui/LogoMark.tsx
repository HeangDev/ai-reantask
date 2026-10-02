/** The ReanTask logo glyph: a bookmark with a check. Inherits its colour from the parent via `currentColor`. */
export default function LogoMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M7 3h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5a2 2 0 0 1 2-2z" />
      <path d="m8.75 10.5 2.25 2.25 4.25-4.5" />
    </svg>
  )
}
