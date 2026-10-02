import type { LoginSession } from '@/features/account/types'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Placeholder devices until the account API provides the real login sessions.
export function createSampleSessions(now = Date.now()): LoginSession[] {
  return [
    { id: 'current', device: 'Chrome on Windows', location: 'Phnom Penh, Cambodia', lastActiveAt: now, isCurrent: true, kind: 'desktop' },
    { id: 's-2', device: 'Safari on iPhone', location: 'Phnom Penh, Cambodia', lastActiveAt: now - 2 * HOUR, isCurrent: false, kind: 'phone' },
    { id: 's-3', device: 'Firefox on macOS', location: 'Siem Reap, Cambodia', lastActiveAt: now - 3 * DAY, isCurrent: false, kind: 'desktop' },
    { id: 's-4', device: 'Edge on Windows', location: 'Bangkok, Thailand', lastActiveAt: now - 12 * DAY, isCurrent: false, kind: 'desktop' },
  ]
}
