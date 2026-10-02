import { useSyncExternalStore } from 'react'
import { initiallyConnected } from '@/features/integrations/data/integrations'
import type { IntegrationId } from '@/features/integrations/types'

// Shared by the Integration page and the header status. A minimal in-memory store until an API is documented.
let connected: ReadonlySet<IntegrationId> = initiallyConnected
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useConnectedIntegrations = () => useSyncExternalStore(subscribe, () => connected)

export const integrationsActions = {
  /** Flips the connection and returns whether the integration is now connected. */
  toggle: (id: IntegrationId) => {
    const next = new Set(connected)
    const nowConnected = !next.delete(id)
    if (nowConnected) next.add(id)
    connected = next
    listeners.forEach((listener) => listener())
    return nowConnected
  },
}
