import { useI18n } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import type { AssignmentStatus } from '@/features/assignments/types'

const steps: TranslationKey[] = ['step.assigned', 'status.submitted', 'status.graded']

// Index of the step the student is currently on.
const currentStep: Record<AssignmentStatus, number> = { pending: 1, late: 1, resubmit: 1, submitted: 2, graded: 3 }

export default function ProgressStepper({ status }: { status: AssignmentStatus }) {
  const { t } = useI18n()
  const current = currentStep[status]

  return (
    <ol aria-label={t('step.label')} className="flex items-center gap-2">
      {steps.map((key, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={key} aria-current={active ? 'step' : undefined} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={`h-1 rounded-full ${done ? 'bg-accent' : active ? 'bg-accent/40' : 'bg-line'}`} aria-hidden="true" />
            <span className={`truncate text-xs ${done || active ? 'font-medium text-fg' : 'text-muted'}`}>
              {done && <span aria-hidden="true">✓ </span>}
              {t(key)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
