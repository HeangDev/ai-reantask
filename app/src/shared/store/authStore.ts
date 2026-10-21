import { create } from 'zustand'
import { queryClient } from '@/shared/api/queryClient'
import { useProfileStore } from '@/shared/store/profileStore'
import { useTwoFactorStore } from '@/shared/store/twoFactorStore'
import { useShallow } from 'zustand/react/shallow'
import { roles } from '@/shared/types/auth'
import type { Role } from '@/shared/types/auth'

export interface Session {
  role: Role
  /** Lower-case email used to sign in; it is how a teacher is matched to their teacher profile. */
  email: string
  /** Bearer token returned by the login API, sent with authenticated requests. */
  token: string
}

interface AuthState {
  session: Session | null
  setSession: (session: Session) => void
  clear: () => void
}

const STORAGE_KEY = 'session'

/** The session saved by this tab, so a page reload keeps the user signed in; null if none or unreadable. */
function loadSession(): Session | null {
  try {
    const raw: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof raw !== 'object' || raw === null) return null
    const { role, email, token } = raw as Record<string, unknown>
    if (typeof email !== 'string' || typeof token !== 'string' || !token) return null
    const knownRole = roles.find((r) => r === role)
    return knownRole ? { role: knownRole, email, token } : null
  } catch {
    return null
  }
}

function saveSession(session: Session | null) {
  try {
    if (session) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked or full: the session still works until the next reload.
  }
}

// The signed-in session, shared by the login page, the route guard, the sidebar and the header.
//
// The session is kept in this tab's sessionStorage so a reload does not sign the user out (the API has no
// refresh token yet; see security.md §1). It is cleared on logout and when the tab closes; the access token
// itself expires after 15 minutes. This only decides which screens the interface shows; real access
// control is enforced by the server.
export const useAuthStore = create<AuthState>()((set) => ({
  session: loadSession(),
  setSession: (session) => {
    saveSession(session)
    set({ session })
  },
  // On logout the session and every cached server response are dropped (state-management.md §2).
  clear: () => {
    saveSession(null)
    set({ session: null })
    useProfileStore.getState().reset()
    useTwoFactorStore.getState().disable()
    queryClient.clear()
  },
}))

/** The current session as a hook, for components. */
export const useSession = () => useAuthStore((s) => s.session)

/** The current session without subscribing, for code that runs outside a component. */
export const getSession = () => useAuthStore.getState().session

export const useSessionRole = () => useAuthStore((s) => s.session?.role)

export const useAuthActions = () => useAuthStore(useShallow((s) => ({ signIn: s.setSession, signOut: s.clear })))

export const authActions = {
  signIn: (role: Role, email: string, token: string) =>
    useAuthStore.getState().setSession({ role, email: email.trim().toLowerCase(), token }),
  signOut: () => useAuthStore.getState().clear(),
}
