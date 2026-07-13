import { getEnv } from './env.js'

function b64url(data) {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

function bufToB64url(buf) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlToBuf(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const bin = atob(str)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

async function hmacKey() {
  const env = getEnv()
  const secret = env.JWT_SECRET || 'contractdiff-dev-secret'
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function generateToken(userId) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(
    JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + 86400 * 7 })
  )
  const key = await hmacKey()
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${header}.${payload}`)
  )
  return `${header}.${payload}.${bufToB64url(sig)}`
}

export async function verifyToken(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const key = await hmacKey()
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBuf(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    )
    if (!valid) return null
    const payload = JSON.parse(b64urlDecode(parts[1]))
    if (payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}
