/** "5 min. ago", "3 hr. ago", "yesterday": the largest unit that fits, in the given locale. */
export function formatTimeAgo(time: number, locale: string, now = Date.now()) {
  const minutes = Math.round((time - now) / 60000)
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
  if (Math.abs(minutes) < 60) return format.format(minutes, 'minute')
  if (Math.abs(minutes) < 60 * 24) return format.format(Math.round(minutes / 60), 'hour')
  return format.format(Math.round(minutes / (60 * 24)), 'day')
}
