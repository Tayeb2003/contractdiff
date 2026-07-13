import { getEnv } from './env.js'

let _url = ''
let _token = ''

export function initTurso() {
  const env = getEnv()
  let url = env.TURSO_DATABASE_URL || ''
  // Convert libsql:// to https:// for the REST API
  if (url.startsWith('libsql://')) {
    url = 'https://' + url.slice(9)
  }
  _url = url
  _token = env.TURSO_AUTH_TOKEN || ''
}

let dbInitialized = false

export async function initDb() {
  if (dbInitialized) return
  dbInitialized = true

  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      plan TEXT DEFAULT 'free',
      stripe_customer_id TEXT,
      ai_api_key TEXT,
      ai_provider TEXT DEFAULT 'gemini',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
      `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      content TEXT,
      doc_type TEXT,
      upload_date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
      `CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      doc_a_id TEXT NOT NULL,
      doc_b_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      summary TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (doc_a_id) REFERENCES documents(id),
      FOREIGN KEY (doc_b_id) REFERENCES documents(id)
    )`,
      `CREATE TABLE IF NOT EXISTS clause_diffs (
      id TEXT PRIMARY KEY,
      analysis_id TEXT NOT NULL,
      clause_text_before TEXT,
      clause_text_after TEXT,
      plain_english_summary TEXT,
      favors TEXT,
      severity TEXT,
      FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    )`,
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    ].map((sql) => ({ sql, args: [] }))
  )
}

function toArg(value) {
  if (value === null || value === undefined) return { type: 'null', value: null }
  if (typeof value === 'number') return { type: 'integer', value }
  if (typeof value === 'string') return { type: 'text', value }
  return { type: 'text', value: String(value) }
}

function rowToObj(cols, row) {
  const obj = {}
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]
    const cell = row[i]
    obj[col.name] = cell?.value ?? null
  }
  return obj
}

async function pipeline(requests) {
  const res = await fetch(`${_url}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Turso error (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json()
}

export const db = {
  async execute({ sql, args }) {
    const body = await pipeline([
      {
        type: 'execute',
        stmt: { sql, args: (args || []).map(toArg) },
      },
    ])
    const result = body.results?.[0]
    if (result?.type === 'error') {
      throw new Error(result.error?.message || 'Turso execute error')
    }
    const resp = result?.response?.result
    const cols = resp?.cols || []
    const rows = resp?.rows || []
    return { rows: rows.map((r) => rowToObj(cols, r)) }
  },
  async batch(statements) {
    const reqs = statements.map((s) => {
      const sql = typeof s === 'string' ? s : s.sql
      const args = (typeof s === 'string' ? [] : s.args || []).map(toArg)
      return { type: 'execute', stmt: { sql, args } }
    })
    const body = await pipeline(reqs)
    return body.results?.map((r, i) => {
      if (r?.type === 'error') throw new Error(r.error?.message || `Turso batch error at ${i}`)
      const resp = r?.response?.result
      const cols = resp?.cols || []
      const rows = resp?.rows || []
      return { rows: rows.map((r) => rowToObj(cols, r)) }
    })
  },
}
