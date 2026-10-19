import type { ActiveStatus } from '@/shared/components/StatusBadge'
import type { TranslationKey } from '@/shared/i18n'

export interface Subject {
  id: string
  name: string
  description: string
  status: ActiveStatus
}

export type SubjectInput = Omit<Subject, 'id'>

export type SubjectFormErrors = Partial<Record<keyof SubjectInput, TranslationKey>>
