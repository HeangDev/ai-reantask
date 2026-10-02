// Time-based one-time passwords (RFC 6238), the codes authenticator apps show: 6 digits, a new one every 30 seconds.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const STEP_SECONDS = 30
const DIGITS = 1_000_000

function decodeBase32(input: string): Uint8Array<ArrayBuffer> {
  const bytes: number[] = []
  let value = 0
  let bits = 0
  for (const char of input.replace(/\s/g, '').toUpperCase()) {
    const index = ALPHABET.indexOf(char)
    if (index < 0) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Uint8Array.from(bytes)
}

async function codeFor(secret: Uint8Array<ArrayBuffer>, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const message = new ArrayBuffer(8)
  const view = new DataView(message)
  view.setUint32(0, Math.floor(counter / 2 ** 32))
  view.setUint32(4, counter >>> 0)
  const hash = new Uint8Array(await crypto.subtle.sign('HMAC', key, message))
  const offset = hash[19] & 0x0f
  const binary =
    ((hash[offset] & 0x7f) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]
  return String(binary % DIGITS).padStart(6, '0')
}

/**
 * Whether `code` is what an authenticator app holding `secret` (base32) shows right now. The code from the
 * step before and after is accepted too, to allow for a slightly wrong clock.
 * Needs a secure context (https or localhost); anywhere else it simply reports false.
 */
export async function verifyTotp(secret: string, code: string, now = Date.now()): Promise<boolean> {
  try {
    const key = decodeBase32(secret)
    const step = Math.floor(now / 1000 / STEP_SECONDS)
    for (const drift of [-1, 0, 1]) {
      if ((await codeFor(key, step + drift)) === code) return true
    }
  } catch {
    // Web Crypto is unavailable.
  }
  return false
}
