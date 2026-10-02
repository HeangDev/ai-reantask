/** The message shown inside a table that has no rows: a title, and optionally a line of help under it. */
export default function TableEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <p className="font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </>
  )
}
