import type { ActiveStatus } from '@/components/ui/StatusBadge'
import type { TranslationKey } from '@/lib/i18n'

export interface Subject {
  id: string
  name: string
  description: string
  status: ActiveStatus
}

export type SubjectInput = Omit<Subject, 'id'>

export type SubjectFormErrors = Partial<Record<keyof SubjectInput, TranslationKey>>
