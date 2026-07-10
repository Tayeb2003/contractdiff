import { createClient, type Client } from '@libsql/client/web'

let _client: Client | null = null

function getClient(): Client {
  if (_client) return _client
  const url = process.env.TURSO_DATABASE_URL || ''
  const authToken = process.env.TURSO_AUTH_TOKEN || ''
  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is required')
  }
  _client = createClient({ url, authToken })
  return _client
}

export const db = new Proxy({} as Client, {
  get(_, prop) {
    const client = getClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export async function initDb(): Promise<void> {
  await db.batch([
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
  ])
}
