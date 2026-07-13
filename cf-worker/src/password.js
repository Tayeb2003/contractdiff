const ITERATIONS = 1_000

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  )
  const sB64 = btoa(String.fromCharCode(...salt))
  const hB64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
  return `pbkdf2:${ITERATIONS}:${sB64}:${hB64}`
}

export async function comparePassword(password, stored) {
  const parts = stored.split(':')
  if (parts[0] !== 'pbkdf2') return false
  const iterations = parseInt(parts[1], 10)
  const salt = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256
  )
  return btoa(String.fromCharCode(...new Uint8Array(hash))) === parts[3]
}
