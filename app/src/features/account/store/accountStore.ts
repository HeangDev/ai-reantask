import { useSyncExternalStore } from 'react'
import { currentUser } from '@/lib/currentUser'
import type { CurrentUser } from '@/lib/currentUser'

// In-memory account state, shared by the header, the logout dialog and the Account page.
// A minimal store until an account API is documented.
function createStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (next: T) => {
      value = next
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const profileStore = createStore<CurrentUser>(currentUser)
// The authenticator secret while two-factor authentication is on, otherwise null. Kept in memory only, never saved.
const twoFactorStore = createStore<string | null>(null)

export const useProfile = () => useSyncExternalStore(profileStore.subscribe, profileStore.get)
export const useTwoFactorEnabled = () =>
  useSyncExternalStore(twoFactorStore.subscribe, () => twoFactorStore.get() !== null)

/** The current secret without subscribing, for the second step of signing in. */
export const getTwoFactorSecret = () => twoFactorStore.get()

export const accountActions = {
  /** Replaces the whole profile, for example with the signed-in user from the API. */
  setProfile: (profile: CurrentUser) => profileStore.set(profile),

  /** The email is deliberately not editable. */
  updateProfile: (changes: Partial<Pick<CurrentUser, 'fullName' | 'avatarUrl'>>) =>
    profileStore.set({ ...profileStore.get(), ...changes }),

  enableTwoFactor: (secret: string) => twoFactorStore.set(secret),
  disableTwoFactor: () => twoFactorStore.set(null),

}
