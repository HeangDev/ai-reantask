import { create } from 'zustand'
import type { CurrentUser } from '@/shared/lib/currentUser'

/** Edits the user made on the Account page. Until the API can save a profile they live here, in memory only. */
type ProfileOverrides = Partial<Pick<CurrentUser, 'fullName' | 'avatarUrl'>>

interface ProfileState {
  overrides: ProfileOverrides
  update: (changes: ProfileOverrides) => void
  reset: () => void
}

export const useProfileStore = create<ProfileState>()((set) => ({
  overrides: {},
  update: (changes) => set((s) => ({ overrides: { ...s.overrides, ...changes } })),
  reset: () => set({ overrides: {} }),
}))
