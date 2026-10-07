interface Options {
  /** Rows on the current page. */
  rows: { id: string }[]
  selected: ReadonlySet<string>
  onSelectedChange: (ids: Set<string>) => void
}

export function useRowSelection({ rows, selected, onSelectedChange }: Options) {
  const selectedOnPage = rows.filter((r) => selected.has(r.id)).length
  const allOnPage = rows.length > 0 && selectedOnPage === rows.length

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (!next.delete(id)) next.add(id)
    onSelectedChange(next)
  }
  const togglePage = () => {
    const next = new Set(selected)
    rows.forEach((r) => (allOnPage ? next.delete(r.id) : next.add(r.id)))
    onSelectedChange(next)
  }

  return { allOnPage, someOnPage: selectedOnPage > 0 && !allOnPage, toggle, togglePage }
}
