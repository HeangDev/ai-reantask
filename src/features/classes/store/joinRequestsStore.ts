import { useMemo, useSyncExternalStore } from 'react'
import { currentUser } from '@/lib/currentUser'

export type JoinRequestStatus = 'pending' | 'approved' | 'declined'

export interface JoinRequest {
  id: string
  classId: string
  /** Who asked. The signed-in student is always ME; the rest stand for other students. */
  studentId: string
  /** Display name of the student, as the teacher sees it. */
  student: string
  status: JoinRequestStatus
  /** Epoch milliseconds the student asked. */
  createdAt: number
}

/** The signed-in student. */
export const ME = 'me'

// A student joins a class only after the teacher approves their request, so membership is simply the approved
// requests. A minimal in-memory store until a join API is documented. It starts with the student already in
// "Web Development", and another student waiting for approval to join "Web Development II".
let requests: JoinRequest[] = [
  { id: 'req-1', classId: '4', studentId: ME, student: currentUser.fullName, status: 'approved', createdAt: Date.now() - 6 * 24 * 3_600_000 },
  { id: 'req-2', classId: '7', studentId: 'sokha', student: 'Sokha Chan', status: 'pending', createdAt: Date.now() - 25 * 60_000 },
]
const listeners = new Set<() => void>()

function commit(next: JoinRequest[]) {
  requests = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useJoinRequests = () => useSyncExternalStore(subscribe, () => requests)

export const joinRequestsActions = {
  /** The signed-in student asks to join a class. Returns the request. */
  request: (classId: string, student: string): JoinRequest => {
    const next: JoinRequest = { id: crypto.randomUUID(), classId, studentId: ME, student, status: 'pending', createdAt: Date.now() }
    commit([...requests, next])
    return next
  },

  resolve: (id: string, status: Exclude<JoinRequestStatus, 'pending'>) =>
    commit(requests.map((r) => (r.id === id ? { ...r, status } : r))),
}

/** Ids of the classes the signed-in student has been approved into. */
export function joinedClassIds(all: JoinRequest[]): ReadonlySet<string> {
  return new Set(all.filter((r) => r.studentId === ME && r.status === 'approved').map((r) => r.classId))
}

/** Ids of the classes the signed-in student is still waiting to be let into. */
export function pendingClassIds(all: JoinRequest[]): ReadonlySet<string> {
  return new Set(all.filter((r) => r.studentId === ME && r.status === 'pending').map((r) => r.classId))
}

export function useJoinedClassIds() {
  const all = useJoinRequests()
  return useMemo(() => joinedClassIds(all), [all])
}

export function usePendingClassIds() {
  const all = useJoinRequests()
  return useMemo(() => pendingClassIds(all), [all])
}
