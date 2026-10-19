import { create } from 'zustand'

interface TwoFactorState {
  /** The authenticator secret while two-factor authentication is on, otherwise null. In memory only, never saved. */
  secret: string | null
  enable: (secret: string) => void
  disable: () => void
}

export const useTwoFactorStore = create<TwoFactorState>()((set) => ({
  secret: null,
  enable: (secret) => set({ secret }),
  disable: () => set({ secret: null }),
}))

export const useTwoFactorEnabled = () => useTwoFactorStore((s) => s.secret !== null)

/** The current secret without subscribing, for the second step of signing in. */
export const getTwoFactorSecret = () => useTwoFactorStore.getState().secret
