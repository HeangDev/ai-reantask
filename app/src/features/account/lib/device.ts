const BROWSERS: [RegExp, string][] = [
  [/edg(e|a|ios)?\//i, 'Edge'],
  [/opr\/|opera/i, 'Opera'],
  [/firefox|fxios/i, 'Firefox'],
  [/chrome|crios/i, 'Chrome'],
  [/safari/i, 'Safari'],
]

const SYSTEMS: [RegExp, string][] = [
  [/iphone|ipad|ios/i, 'iOS'],
  [/android/i, 'Android'],
  [/windows/i, 'Windows'],
  [/mac os|macintosh/i, 'macOS'],
  [/linux/i, 'Linux'],
]

/** A short label such as "Chrome on Windows" from a User-Agent; the IP address if it cannot be read; '' if neither. */
export function describeDevice(userAgent: string | null, ipAddress: string | null): string {
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent ?? ''))?.[1]
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent ?? ''))?.[1]
  if (browser && system) return `${browser} on ${system}`
  return browser ?? system ?? ipAddress ?? ''
}

export const isPhone = (userAgent: string | null) => /iphone|android.+mobile|mobile/i.test(userAgent ?? '')
