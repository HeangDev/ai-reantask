import { useToast } from '@/shared/components/Toast'
import { fromForm } from '@/features/assignments/lib/assignForm'
import type { AssignFormValues } from '@/features/assignments/lib/assignValidation'
import { planRepository } from '@/features/assignments/lib/repoNames'
import { setUpRepository } from '@/features/assignments/services/setUpRepository'
import { assignmentsActions } from '@/features/assignments/store/assignmentsStore'
import { useI18n } from '@/shared/i18n'

/** Saves a new assignment from the form, plans its repository and branches, and tells the teacher. */
export function useCreateAssignment() {
  const { t } = useI18n()
  const { notify } = useToast()

  return (values: AssignFormValues) => {
    const id = crypto.randomUUID()
    const fields = fromForm(values)
    assignmentsActions.add({ id, status: 'pending', ...fields })
    const plan = planRepository(fields.className, fields.title, fields.assignees)
    void setUpRepository(id, plan)
    notify({ title: t('asg.added'), subtitle: t('asg.repoSetup', { name: plan.name, count: String(plan.branches.length) }) })
  }
}
