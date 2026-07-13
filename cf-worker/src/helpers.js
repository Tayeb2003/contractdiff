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
