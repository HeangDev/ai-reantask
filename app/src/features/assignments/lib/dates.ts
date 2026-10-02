export const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })

/** Whole days from today until the deadline; negative when overdue. */
export const daysUntil = (iso: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${iso}T00:00:00`)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}
