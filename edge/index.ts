import { initDb } from './db.js'
import { json, handleError, rateLimit } from './helpers.js'
import {
  handleSignup, handleLogin, handleMe,
  handleGetKey, handlePutKey,
  handleForgotPassword, handleResetPassword,
} from './routes/auth.js'
import { handleUpload, handlePaste, handleListDocs, handleDeleteDoc } from './routes/documents.js'
import { handleCreateAnalysis, handleListAnalyses, handleGetAnalysis, handleDeleteAnalysis } from './routes/analyses.js'

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
const DEFAULT_ORIGIN = process.env.APP_URL || 'http://localhost:3000'

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers({ 'content-type': 'application/json' })
  // Effective allowlist: fall back to the app origin when none is configured,
  // mirroring the Express server. Credentials are only enabled for an
  // EXPLICIT allowlist (no `*`), so we never reflect an arbitrary request
  // origin together with `Access-Control-Allow-Credentials: true`.
  const effective = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : [DEFAULT_ORIGIN]
  const allowCreds = !effective.includes('*')
  const allowedOrigin = effective.includes('*') ? origin || '*' : effective[0]
  if (allowCreds) {
    // Allow only the configured/default origin (reflected or not) with creds.
    if (effective.includes(origin || '') || origin === DEFAULT_ORIGIN || !origin) {
      headers.set('access-control-allow-origin', origin || DEFAULT_ORIGIN)
      headers.set('access-control-allow-credentials', 'true')
    }
  } else {
    // Public mode (contains '*') — no credentials, allow the origin.
    headers.set('access-control-allow-origin', allowedOrigin)
  }
  headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('access-control-allow-headers', 'Content-Type, Authorization')
  return headers
}

function matchRoute(method: string, path: string): { handler?: Function; params: Record<string, string> } {
  const routes: [string, string, Function][] = [
    ['POST', '/api/auth/signup', handleSignup],
    ['POST', '/api/auth/login', handleLogin],
    ['POST', '/api/auth/forgot-password', handleForgotPassword],
    ['POST', '/api/auth/reset-password', handleResetPassword],
    ['GET', '/api/auth/me', handleMe],
    ['GET', '/api/auth/key', handleGetKey],
    ['PUT', '/api/auth/key', handlePutKey],
    ['POST', '/api/documents/upload', handleUpload],
    ['POST', '/api/documents/paste', handlePaste],
    ['GET', '/api/documents', handleListDocs],
    ['DELETE', '/api/documents/:id', handleDeleteDoc],
    ['POST', '/api/analyses/create', handleCreateAnalysis],
    ['GET', '/api/analyses', handleListAnalyses],
    ['GET', '/api/analyses/:id', handleGetAnalysis],
    ['DELETE', '/api/analyses/:id', handleDeleteAnalysis],
  ]
  for (const [m, p, handler] of routes) {
    if (m !== method) continue
    const parts = p.split('/')
    const urlParts = path.replace(/\/+$/, '').split('/')
    if (parts.length !== urlParts.length) continue
    const params: Record<string, string> = {}
    let match = true
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(':')) {
        params[parts[i].slice(1)] = decodeURIComponent(urlParts[i])
      } else if (parts[i] !== urlParts[i]) {
        match = false
        break
      }
    }
    if (match) return { handler, params }
  }
  return { handler: undefined, params: {} }
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (path === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders(origin) })
  }

  if (path === '/api') {
    return new Response(JSON.stringify({ name: 'ContractDiff API', version: '1.0.0', docs: '/api/docs', health: '/api/health' }), { headers: corsHeaders(origin) })
  }

  const { handler, params } = matchRoute(request.method, path)
  if (handler) {
    // Brute-force / abuse protection on the auth surface (M6).
    if (request.method === 'POST' && path.startsWith('/api/auth/')) {
      const limiter =
        path === '/api/auth/forgot-password'
          ? rateLimit(request, 60 * 60 * 1000, 5)
          : rateLimit(request, 15 * 60 * 1000, 20)
      if (limiter.limited) {
        return new Response(
          JSON.stringify({ error: 'Too many attempts, please try again later.' }),
          { status: 429, headers: { ...corsHeaders(origin), 'Retry-After': String(limiter.retryAfter) } }
        )
      }
    }
    try {
      const response = await handler(request, params.id)
      const res = response instanceof Response ? response : json(response)
      const headers = corsHeaders(origin)
      res.headers.forEach((v, k) => headers.set(k, v))
      return new Response(res.body, { status: res.status, headers })
    } catch (err) {
      const res = handleError(err)
      const headers = corsHeaders(origin)
      res.headers.forEach((v, k) => headers.set(k, v))
      return new Response(res.body, { status: res.status, headers })
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders(origin) })
}

// Initialize the DB exactly once and await it before serving any request, so
// a cold start never races ahead of table creation (M3).
let initPromise: Promise<void> | null = null

export default {
  async fetch(request: Request): Promise<Response> {
    if (!initPromise) {
      initPromise = initDb().catch((e) => {
        console.error('Database initialization failed', e)
        throw e
      })
    }
    await initPromise
    return handleRequest(request)
  },
}
