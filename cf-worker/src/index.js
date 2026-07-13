import { handleRequest } from './router.js'
import { setEnv, getEnv } from './env.js'
import { initTurso, initDb } from './db.js'

export default {
  async fetch(request, env, ctx) {
    setEnv(env)
    initTurso()
    ctx.waitUntil(initDb())

    if (request.method === 'OPTIONS') {
      return handleCORS(request)
    }

    const url = new URL(request.url)
    const origin = request.headers.get('origin')

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
      const response = await handleRequest(request)
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
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin === defaultOrigin) {
    headers.set('access-control-allow-origin', origin || '*')
  }
  headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('access-control-allow-headers', 'Content-Type, Authorization')
  headers.set('access-control-allow-credentials', 'true')
  return headers
}

