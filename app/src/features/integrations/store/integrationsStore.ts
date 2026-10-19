import { initiallyConnected } from '@/features/integrations/data/integrations'
import type { IntegrationId } from '@/features/integrations/types'
import { createMockResource } from '@/shared/api/mockResource'

// Shared by the Integration page and the header status. A mock resource until an API is documented.
const connected = createMockResource<ReadonlySet<IntegrationId>>('integrations', initiallyConnected)

export const useConnectedIntegrations = connected.useValue

export const integrationsActions = {
  /** Flips the connection and returns whether the integration is now connected. */
  toggle: (id: IntegrationId) => {
    const next = new Set(connected.get())
    const nowConnected = !next.delete(id)
    if (nowConnected) next.add(id)
    connected.set(next)
    return nowConnected
  },
}
