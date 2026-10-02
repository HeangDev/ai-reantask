import { useSyncExternalStore } from 'react'
import type { Role } from '@/features/auth/types'

export interface Session {
  role: Role
}

// The signed-in session, shared by the login page, the route guard, the sidebar and the header.
//
// No authentication API is documented yet (see authService), so the role is simply what was chosen at
// login. It is kept in sessionStorage so a page reload does not sign you out. This only decides which
// screens the interface shows; real access control must be enforced by the server.
const STORAGE_KEY = 'session-role'

function load(): Session | null {
  try {
    const role = sessionStorage.getItem(STORAGE_KEY)
    return role === 'teacher' || role === 'student' ? { role } : null
  } catch {
    return null
  }
}

let session: Session | null = load()
const listeners = new Set<() => void>()

function commit(next: Session | null) {
  session = next
  try {
    if (next) sessionStorage.setItem(STORAGE_KEY, next.role)
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
  signIn: (role: Role) => commit({ role }),
  signOut: () => commit(null),
}
