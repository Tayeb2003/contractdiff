import { initDb } from './db.js'
import { json, handleError } from './helpers.js'
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
  if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin || '') || origin === DEFAULT_ORIGIN) {
    headers.set('access-control-allow-origin', origin || '*')
  }
  headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('access-control-allow-headers', 'Content-Type, Authorization')
  headers.set('access-control-allow-credentials', 'true')
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

let initialized = false

export default {
  fetch(request: Request): Promise<Response> | Response {
    if (!initialized) {
      initialized = true
      initDb().catch(console.error)
    }
    return handleRequest(request)
  },
}
