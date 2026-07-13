import { verifyToken } from './jwt.js'

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export async function getAuthUser(req) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const decoded = await verifyToken(auth.slice(7))
  return decoded ? { userId: decoded.userId } : null
}

export async function requireAuth(req) {
  const user = await getAuthUser(req)
  if (!user) throw new AuthError()
  return user
}

export class AuthError extends Error {
  statusCode = 401
  constructor() {
    super('Unauthorized')
    this.name = 'AuthError'
  }
}

export class AppError extends Error {
  statusCode
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export async function parseBody(req) {
  const text = await req.text()
  if (!text) return {}
  return JSON.parse(text)
}

export function handleError(err) {
  if (err instanceof AuthError) return json({ error: err.message }, 401)
  if (err instanceof AppError) return json({ error: err.message }, err.statusCode)
  if (err instanceof Error && 'statusCode' in err && typeof err.statusCode === 'number') {
    return json({ error: err.message }, err.statusCode)
  }
  const msg = err instanceof Error ? err.message : 'Internal server error'
  console.error('Unhandled error:', msg)
  return json({ error: 'Internal server error' }, 500)
}

// --- Minimal in-memory fixed-window rate limiter (single isolate). ---
// For multi-instance deployments, back this with a shared store (e.g. Workers
// KV or Durable Objects) keyed by client IP.
const rateBuckets = new Map()

export function rateLimit(request, windowMs, max) {
  const url = new URL(request.url)
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${url.pathname}:${clientIp}`
  const now = Date.now()
  let b = rateBuckets.get(key)
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs }
    rateBuckets.set(key, b)
  }
  b.count += 1
  if (b.count > max) {
    return { limited: true, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) }
  }
  return { limited: false, retryAfter: 0 }
}
