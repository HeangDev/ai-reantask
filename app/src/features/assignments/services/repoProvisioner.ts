import type { AssignmentRepo } from '@/features/assignments/types'

/**
 * Creates the GitHub repository for an assignment and one branch per student.
 *
 * Talking to GitHub needs an access token, and a token must never be shipped to the browser. The real
 * implementation therefore belongs on a backend (for example a GitHub App installation) that the app
 * calls; it is not documented in docs/api.md yet, so none is assumed here. Until then the simulated
 * provisioner below only confirms the planned names, so the rest of the app can be built and used.
 */
export interface RepoProvisioner {
  /** Receives the planned repository and resolves with its final state. Branches that already exist are left alone. */
  provision: (plan: AssignmentRepo) => Promise<AssignmentRepo>
}

const SIMULATED_DELAY_MS = 700

export const simulatedProvisioner: RepoProvisioner = {
  provision: (plan) =>
    new Promise((resolve) => {
      setTimeout(() => resolve({ ...plan, status: 'simulated' }), SIMULATED_DELAY_MS)
    }),
}

// Swap this for the real, backend-backed provisioner when it exists.
export const repoProvisioner: RepoProvisioner = simulatedProvisioner
