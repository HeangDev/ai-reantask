import { useSyncExternalStore } from 'react'
import { sampleUsers } from '@/features/users/data/sampleUsers'
import type { User, UserInput } from '@/features/users/types'

// Shared by the Users page and registration, so a student an admin approves shows up in the list.
// A minimal in-memory store until a users API is documented.
let users: User[] = sampleUsers
const listeners = new Set<() => void>()

function commit(next: User[]) {
  users = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useUsers = () => useSyncExternalStore(subscribe, () => users)

/** The current users without subscribing, for code that runs outside a component. */
export const getUsers = () => users

export const usersActions = {
  add: (input: UserInput) => commit([...users, { id: crypto.randomUUID(), ...input }]),

  update: (id: string, changes: Partial<UserInput>) =>
    commit(users.map((u) => (u.id === id ? { ...u, ...changes } : u))),

  remove: (ids: ReadonlySet<string>) => commit(users.filter((u) => !ids.has(u.id))),
}
