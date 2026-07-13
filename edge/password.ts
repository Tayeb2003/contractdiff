const ITERATIONS = 100_000

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  const sB64 = btoa(String.fromCharCode(...salt))
  const hB64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
  return `pbkdf2:${ITERATIONS}:${sB64}:${hB64}`
}

export async function comparePassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  if (parts[0] !== 'pbkdf2') return false
  const iterations = parseInt(parts[1], 10)
  const salt = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256)
  const provided = new Uint8Array(hash)
  const expected = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0))
  if (provided.length !== expected.length) return false
  // Constant-time comparison to avoid timing side-channels on the hash.
  // `timingSafeEqual` is part of the WinterCG/Workers crypto surface but is
  // absent from the standard DOM lib typings, hence the cast.
  return (crypto.subtle as unknown as { timingSafeEqual(a: BufferSource, b: BufferSource): Promise<boolean> }).timingSafeEqual(provided, expected)
}
