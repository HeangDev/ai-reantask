import type { RegistrationStatus } from '@/features/classes/lib/registration'
import { createMockResource } from '@/shared/api/mockResource'

export interface ClassInvitation {
  id: string
  classId: string
  /** Lower-case address the invitation was sent to. */
  email: string
  /** Whether the student had an account when the invitation was sent. */
  registration: RegistrationStatus
  /** Epoch milliseconds of the last time it was sent. */
  sentAt: number
}

// A mock resource until an invitation API is documented. Nothing is emailed yet.
const invitations = createMockResource<ClassInvitation[]>('invitations', [])

export const useInvitations = invitations.useValue

export const invitationsActions = {
  /** Invites each address to the class; an address already invited to it is left alone. */
  invite: (classId: string, entries: { email: string; registration: RegistrationStatus }[]) => {
    const current = invitations.get()
    const taken = new Set(current.filter((i) => i.classId === classId).map((i) => i.email))
    const fresh = entries.filter((entry) => !taken.has(entry.email))
    invitations.set([
      ...current,
      ...fresh.map((entry) => ({ id: crypto.randomUUID(), classId, ...entry, sentAt: Date.now() })),
    ])
  },

  resend: (id: string) =>
    invitations.set(invitations.get().map((i) => (i.id === id ? { ...i, sentAt: Date.now() } : i))),

  revoke: (id: string) => invitations.set(invitations.get().filter((i) => i.id !== id)),
}

export const invitationsOfClass = (all: ClassInvitation[], classId: string) =>
  all.filter((i) => i.classId === classId).sort((a, b) => b.sentAt - a.sentAt)
