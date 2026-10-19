import type { TranslationKey } from '@/shared/i18n'

export type IntegrationId = 'github' | 'gitlab' | 'bitbucket'

export interface Integration {
  id: IntegrationId
  name: string
  descriptionKey: TranslationKey
}

export type IntegrationFilter = 'all' | 'connected' | 'disconnected'
