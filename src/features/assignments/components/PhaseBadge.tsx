import type { AssignmentPhase } from '@/features/assignments/types'
import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

export const phases: { value: AssignmentPhase; labelKey: TranslationKey }[] = [
  { value: 'in-progress', labelKey: 'asg.phaseInProgress' },
  { value: 'in-review', labelKey: 'asg.phaseInReview' },
  { value: 'completed', labelKey: 'asg.phaseCompleted' },
]

const styles: Record<AssignmentPhase, { badge: string; dot: string }> = {
  'in-progress': { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300', dot: 'bg-blue-500' },
  'in-review': { badge: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300', dot: 'bg-purple-500' },
  completed: { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300', dot: 'bg-emerald-500' },
}

/** Dot plus label, so the state never relies on colour alone. */
export default function PhaseBadge({ phase }: { phase: AssignmentPhase }) {
  const { t } = useI18n()
  const label = phases.find((p) => p.value === phase)?.labelKey ?? 'asg.phaseInProgress'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${styles[phase].badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles[phase].dot}`} aria-hidden="true" />
      {t(label)}
    </span>
  )
}
