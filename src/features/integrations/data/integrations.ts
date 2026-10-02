import type { Integration, IntegrationId } from '@/features/integrations/types'

export const integrations: Integration[] = [
  { id: 'github', name: 'GitHub', descriptionKey: 'int.github' },
  { id: 'gitlab', name: 'GitLab', descriptionKey: 'int.gitlab' },
  { id: 'bitbucket', name: 'Bitbucket', descriptionKey: 'int.bitbucket' },
]

// No integrations API is documented yet, so connection state starts from this local default.
export const initiallyConnected: ReadonlySet<IntegrationId> = new Set<IntegrationId>(['github'])
