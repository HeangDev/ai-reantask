import { CLASS_CODE_LENGTH, generateClassCode, normalizeClassCode } from '@/features/classes/lib/classCode'
import { parseEmails } from '@/features/classes/lib/inviteEmails'

describe('class code', () => {
  it('R-CL1: input is case-insensitive and ignores spaces and hyphens', () => {
    expect(normalizeClassCode('k7m4 qx')).toBe('K7M4QX')
    expect(normalizeClassCode(' k7m-4qx ')).toBe('K7M4QX')
  })

  it('R-CL1: a generated code never contains the easily confused 0 O 1 I', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateClassCode(new Set())
      expect(code).toHaveLength(CLASS_CODE_LENGTH)
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/)
    }
  })

  it('R-CL1: a generated code is unique among existing codes', () => {
    const taken = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const code = generateClassCode(taken)
      expect(taken.has(code)).toBe(false)
      taken.add(code)
    }
  })
})

describe('parseEmails', () => {
  it('splits on commas, semicolons and whitespace and lower-cases', () => {
    const result = parseEmails('A@x.com, b@x.com;\nc@x.com')
    expect(result.valid).toEqual(['a@x.com', 'b@x.com', 'c@x.com'])
  })

  it('separates invalid text and repeats', () => {
    const result = parseEmails('a@x.com a@x.com nope b@x.com', new Set(['b@x.com']))
    expect(result.valid).toEqual(['a@x.com'])
    expect(result.duplicates).toEqual(['a@x.com', 'b@x.com'])
    expect(result.invalid).toEqual(['nope'])
  })

  it('empty input gives nothing', () => {
    expect(parseEmails('  ,; ')).toEqual({ valid: [], invalid: [], duplicates: [] })
  })
})
