import { repoProvisioner } from '@/features/assignments/services/repoProvisioner'
import { assignmentsActions } from '@/features/assignments/store/assignmentsStore'
import type { AssignmentRepo } from '@/features/assignments/types'

/** Shows the planned repository straight away, then replaces it with the real outcome. */
export async function setUpRepository(assignmentId: string, plan: AssignmentRepo) {
  assignmentsActions.update(assignmentId, { repo: plan })
  try {
    assignmentsActions.update(assignmentId, { repo: await repoProvisioner.provision(plan) })
  } catch {
    assignmentsActions.update(assignmentId, { repo: { ...plan, status: 'failed' } })
  }
}
