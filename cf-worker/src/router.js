import { json, handleError } from './helpers.js'
import {
  handleSignup, handleLogin, handleMe,
  handleGetKey, handlePutKey,
  handleForgotPassword, handleResetPassword,
} from './routes/auth.js'
import { handleUpload, handlePaste, handleListDocs, handleDeleteDoc } from './routes/documents.js'
import {
  handleCreateAnalysis, handleListAnalyses, handleGetAnalysis, handleDeleteAnalysis,
} from './routes/analyses.js'

const routes = [
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

function matchRoute(method, path) {
  for (const [m, p, handler] of routes) {
    if (m !== method) continue
    const parts = p.split('/')
    const urlParts = path.replace(/\/+$/, '').split('/')
    if (parts.length !== urlParts.length) continue
    const params = {}
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

export async function handleRequest(request, ctx) {
  const url = new URL(request.url)
  const { handler, params } = matchRoute(request.method, url.pathname)

  if (handler) {
    try {
      const response = await handler(request, params.id, ctx)
      return response instanceof Response ? response : json(response)
    } catch (err) {
      return handleError(err)
    }
  }

  return json({ error: 'Not found' }, 404)
}
