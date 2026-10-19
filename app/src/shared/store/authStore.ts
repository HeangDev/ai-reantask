import { create } from 'zustand'
import { queryClient } from '@/shared/api/queryClient'
import { useProfileStore } from '@/shared/store/profileStore'
import { useTwoFactorStore } from '@/shared/store/twoFactorStore'
import { useShallow } from 'zustand/react/shallow'
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

// The signed-in session, shared by the login page, the route guard, the sidebar and the header.
//
// The token is kept in memory only (security.md §1): it is never written to localStorage or
// sessionStorage, so a page reload signs the user out. This only decides which screens the interface
// shows; real access control is enforced by the server.
export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  // On logout the session and every cached server response are dropped (state-management.md §2).
  clear: () => {
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
