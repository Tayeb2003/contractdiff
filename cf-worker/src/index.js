import { handleRequest } from './router.js'
import { setEnv, getEnv } from './env.js'
import { initTurso, initDb } from './db.js'
import { rateLimit } from './helpers.js'

// Initialize the DB exactly once and await it before serving any request so a
// cold start never races ahead of table creation (M3).
let initPromise = null

export default {
  async fetch(request, env, ctx) {
    setEnv(env)
    initTurso()
    if (!initPromise) initPromise = initDb()
    await initPromise

    if (request.method === 'OPTIONS') {
      return handleCORS(request)
    }

    const url = new URL(request.url)
    const origin = request.headers.get('origin')

    // Brute-force / abuse protection on the auth surface (M6).
    if (request.method === 'POST' && url.pathname.startsWith('/api/auth/')) {
      const limiter =
        url.pathname === '/api/auth/forgot-password'
          ? rateLimit(request, 60 * 60 * 1000, 5)
          : rateLimit(request, 15 * 60 * 1000, 20)
      if (limiter.limited) {
        return new Response(
          JSON.stringify({ error: 'Too many attempts, please try again later.' }),
          { status: 429, headers: { ...corsHeaders(origin), 'Retry-After': String(limiter.retryAfter) } }
        )
      }
    }

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(
        JSON.stringify({
          name: 'ContractDiff API',
          version: '1.0.0',
          description: 'AI-powered contract comparison backend',
          endpoints: '/api',
          health: '/api/health',
          frontend: 'https://contractdiff.wasmer.app',
        }),
        { headers: corsHeaders(origin) }
      )
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: corsHeaders(origin),
      })
    }

    if (url.pathname === '/api') {
      return new Response(
        JSON.stringify({
          name: 'ContractDiff API',
          version: '1.0.0',
          health: '/api/health',
        }),
        { headers: corsHeaders(origin) }
      )
    }

    try {
      const response = await handleRequest(request, ctx)
      const headers = corsHeaders(origin)
      response.headers.forEach((v, k) => headers.set(k, v))
      return new Response(response.body, { status: response.status, headers })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error'
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: corsHeaders(origin),
      })
    }
  },
}

function handleCORS(request) {
  const origin = request.headers.get('origin')
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

function corsHeaders(origin) {
  const env = getEnv()
  const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)
  const defaultOrigin = env.APP_URL || 'http://localhost:3000'
  const headers = new Headers({ 'content-type': 'application/json' })
  // Effective allowlist: fall back to the app origin when none is configured,
  // mirroring the Express server. Credentials are only enabled for an
  // EXPLICIT allowlist (no `*`), so we never reflect an arbitrary request
  // origin together with `Access-Control-Allow-Credentials: true`.
  const effective = allowedOrigins.length ? allowedOrigins : [defaultOrigin]
  const allowCreds = !effective.includes('*')
  const allowedOrigin = effective.includes('*') ? origin || '*' : effective[0]
  if (allowCreds) {
    if (effective.includes(origin || '') || origin === defaultOrigin || !origin) {
      headers.set('access-control-allow-origin', origin || defaultOrigin)
      headers.set('access-control-allow-credentials', 'true')
    }
  } else {
    headers.set('access-control-allow-origin', allowedOrigin)
  }
  headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('access-control-allow-headers', 'Content-Type, Authorization')
  return headers
}

