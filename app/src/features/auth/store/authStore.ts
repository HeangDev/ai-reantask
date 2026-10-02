import { useSyncExternalStore } from 'react'
import { roles } from '@/features/auth/types'
import type { Role } from '@/features/auth/types'

export interface Session {
  role: Role
  /** Lower-case email used to sign in; it is how a teacher is matched to their teacher profile. */
  email: string
}

// The signed-in session, shared by the login page, the route guard, the sidebar and the header.
//
// No authentication API is documented yet (see authService), so the role is simply what was chosen at
// login. It is kept in sessionStorage so a page reload does not sign you out. This only decides which
// screens the interface shows; real access control must be enforced by the server.
const STORAGE_KEY = 'session'

function load(): Session | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Session> | null
    return saved && roles.includes(saved.role as Role) && typeof saved.email === 'string' ? (saved as Session) : null
  } catch {
    return null
  }
}

let session: Session | null = load()
const listeners = new Set<() => void>()

function commit(next: Session | null) {
  session = next
  try {
    if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // The session still works for this page load.
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The current session without subscribing, for code that runs outside a component. */
export const getSession = () => session

export const useSession = () => useSyncExternalStore(subscribe, () => session)

export const authActions = {
  signIn: (role: Role, email: string) => commit({ role, email: email.trim().toLowerCase() }),
  signOut: () => commit(null),
}
