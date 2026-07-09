import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'contractdiff.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Migrate existing DBs from the legacy single-key (gemini_api_key) column
// to the per-user provider + key model.
try {
  db.exec('ALTER TABLE users RENAME COLUMN gemini_api_key TO ai_api_key');
} catch {
  // column already migrated or never existed — ignore
}
try {
  db.exec("ALTER TABLE users ADD COLUMN ai_provider TEXT DEFAULT 'gemini'");
} catch {
  // column already exists — ignore
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    plan TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    ai_api_key TEXT,
    ai_provider TEXT DEFAULT 'gemini',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content TEXT,
    doc_type TEXT,
    upload_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS analyses (
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
  );

  CREATE TABLE IF NOT EXISTS clause_diffs (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    clause_text_before TEXT,
    clause_text_after TEXT,
    plain_english_summary TEXT,
    favors TEXT,
    severity TEXT,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id)
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

export default db;
