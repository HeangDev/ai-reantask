import { useSyncExternalStore } from 'react'

export type RegistrationStatus = 'pending' | 'approved' | 'declined'

export interface Registration {
  id: string
  fullName: string
  email: string
  /** Registering always creates a student; an admin adds teachers from the Users page. */
  role: 'Student'
  status: RegistrationStatus
  /** Epoch milliseconds the person registered. */
  createdAt: number
}

// New accounts wait for an admin to approve them, and cannot sign in until then. A minimal in-memory store
// until an API is documented. It starts with one student already waiting, so the approval screen has something to show.
let registrations: Registration[] = [
  { id: 'reg-1', fullName: 'Rathana Keo', email: 'rathana.keo@example.com', role: 'Student', status: 'pending', createdAt: Date.now() - 40 * 60_000 },
]
const listeners = new Set<() => void>()

function commit(next: Registration[]) {
  registrations = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useRegistrations = () => useSyncExternalStore(subscribe, () => registrations)

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/** The latest registration for an email, if the person ever registered. */
export const registrationFor = (email: string) => [...registrations].reverse().find((r) => sameEmail(r.email, email))

export const registrationsActions = {
  register: (fullName: string, email: string): Registration => {
    const next: Registration = { id: crypto.randomUUID(), fullName, email, role: 'Student', status: 'pending', createdAt: Date.now() }
    commit([...registrations, next])
    return next
  },

  resolve: (id: string, status: Exclude<RegistrationStatus, 'pending'>) =>
    commit(registrations.map((r) => (r.id === id ? { ...r, status } : r))),
}
