import { toCsv } from '@/shared/lib/csv'
import { ageFrom, formatDate, todayIso } from '@/shared/lib/dates'
import { getDeviceName } from '@/shared/lib/deviceName'
import { formatTimeAgo } from '@/shared/lib/timeAgo'
import { isValidDateOfBirth, isValidEmail, isValidPhone, usernameFromEmail } from '@/shared/lib/validation'
import { assertNever } from '@/shared/lib/assertNever'

describe('dates', () => {
  it('formatDate keeps the calendar day whatever the time zone', () => {
    expect(formatDate('2026-03-01', 'en-US')).toBe('Mar 1, 2026')
  })

  it('ageFrom counts whole years and waits for the birthday', () => {
    const today = new Date(2026, 5, 15)
    expect(ageFrom('2000-06-15', today)).toBe(26)
    expect(ageFrom('2000-06-16', today)).toBe(25)
    expect(ageFrom('2000-07-01', today)).toBe(25)
    expect(ageFrom('2000-05-31', today)).toBe(26)
  })

  it('todayIso is the local calendar day as YYYY-MM-DD', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 5, 23, 30))
    expect(todayIso()).toBe('2026-01-05')
    jest.useRealTimers()
  })
})

describe('validation', () => {
  it('isValidEmail needs one @ and a dotted domain', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('  a@b.co  ')).toBe(true)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('a b@c.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('isValidPhone accepts 7 to 15 digits with spaces, dashes and a leading +', () => {
    expect(isValidPhone('+855 12-345-678')).toBe(true)
    expect(isValidPhone('1234567')).toBe(true)
    expect(isValidPhone('123456')).toBe(false)
    expect(isValidPhone('1234567890123456')).toBe(false)
    expect(isValidPhone('12a456789')).toBe(false)
  })

  it('isValidDateOfBirth rejects the future and bad shapes', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 5))
    expect(isValidDateOfBirth('2000-01-01')).toBe(true)
    expect(isValidDateOfBirth('2026-01-05')).toBe(true)
    expect(isValidDateOfBirth('2026-01-06')).toBe(false)
    expect(isValidDateOfBirth('01/01/2000')).toBe(false)
    jest.useRealTimers()
  })

  it('usernameFromEmail keeps only characters the API accepts', () => {
    expect(usernameFromEmail('sok.dara+x@example.com')).toBe('sok.dara_x')
    expect(usernameFromEmail('  Dara@example.com ')).toBe('Dara')
  })
})

describe('toCsv', () => {
  it('quotes cells that hold commas, quotes or new lines', () => {
    expect(toCsv([['a', 'b,c'], [1, 'say "hi"'], ['x\ny', 2]])).toBe('a,"b,c"\r\n1,"say ""hi"""\r\n"x\ny",2')
  })

  it('an empty table is an empty string', () => {
    expect(toCsv([])).toBe('')
  })
})

describe('getDeviceName', () => {
  it.each([
    ['Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537', 'Chrome on Windows'],
    ['Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537 Edg/120', 'Edge on Windows'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/17 Safari/605', 'Safari on macOS'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/604', 'Safari on iPhone'],
    ['Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537', 'Chrome on Android'],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Firefox/120.0', 'Firefox on Linux'],
    ['SomethingElse/1.0', 'Browser'],
  ])('%s', (userAgent, expected) => {
    expect(getDeviceName(userAgent)).toBe(expected)
  })
})

describe('formatTimeAgo', () => {
  const now = Date.UTC(2026, 0, 10, 12)
  it('picks the largest fitting unit', () => {
    expect(formatTimeAgo(now - 5 * 60_000, 'en', now)).toMatch(/5 min/)
    expect(formatTimeAgo(now - 3 * 3_600_000, 'en', now)).toMatch(/3 hr/)
    expect(formatTimeAgo(now - 86_400_000, 'en', now)).toMatch(/yesterday/)
  })
})

describe('assertNever', () => {
  it('throws with the unexpected value', () => {
    expect(() => assertNever('x' as never)).toThrow('Unexpected value: x')
  })
})
