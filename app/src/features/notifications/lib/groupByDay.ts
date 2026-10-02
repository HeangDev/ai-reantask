import type { AppNotification } from '@/components/ui/Toast'
import type { TranslationKey } from '@/lib/i18n'

export type DayGroupKey = 'today' | 'yesterday' | 'earlier'

export interface DayGroup {
  key: DayGroupKey
  labelKey: TranslationKey
  items: AppNotification[]
}

const labelKeys: Record<DayGroupKey, TranslationKey> = {
  today: 'notif.today',
  yesterday: 'notif.yesterday',
  earlier: 'notif.groupEarlier',
}

const startOfDay = (time: number) => {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** Splits notifications (newest first) into Today / Yesterday / Earlier, dropping empty groups. */
export function groupByDay(items: AppNotification[], now = Date.now()): DayGroup[] {
  const today = startOfDay(now)
  const yesterday = startOfDay(today - 1)
  const groups: Record<DayGroupKey, AppNotification[]> = { today: [], yesterday: [], earlier: [] }

  for (const item of items) {
    const day = startOfDay(item.createdAt)
    groups[day >= today ? 'today' : day >= yesterday ? 'yesterday' : 'earlier'].push(item)
  }

  return (Object.keys(groups) as DayGroupKey[])
    .filter((key) => groups[key].length > 0)
    .map((key) => ({ key, labelKey: labelKeys[key], items: groups[key] }))
}
