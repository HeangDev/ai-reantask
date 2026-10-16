import { useSyncExternalStore } from 'react'
import type { RegistrationStatus } from '@/features/classes/lib/registration'

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

// A minimal in-memory store until an invitation API is documented in docs/api.md. Nothing is emailed yet.
let invitations: ClassInvitation[] = []
const listeners = new Set<() => void>()

function commit(next: ClassInvitation[]) {
  invitations = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useInvitations = () => useSyncExternalStore(subscribe, () => invitations)

export const invitationsActions = {
  /** Invites each address to the class; an address already invited to it is left alone. */
  invite: (classId: string, entries: { email: string; registration: RegistrationStatus }[]) => {
    const taken = new Set(invitations.filter((i) => i.classId === classId).map((i) => i.email))
    const fresh = entries.filter((entry) => !taken.has(entry.email))
    commit([
      ...invitations,
      ...fresh.map((entry) => ({ id: crypto.randomUUID(), classId, ...entry, sentAt: Date.now() })),
    ])
  },

  resend: (id: string) => commit(invitations.map((i) => (i.id === id ? { ...i, sentAt: Date.now() } : i))),

  revoke: (id: string) => commit(invitations.filter((i) => i.id !== id)),
}

export const invitationsOfClass = (all: ClassInvitation[], classId: string) =>
  all.filter((i) => i.classId === classId).sort((a, b) => b.sentAt - a.sentAt)
