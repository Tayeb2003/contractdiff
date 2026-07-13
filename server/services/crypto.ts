import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
// Note: the prefix MUST NOT contain a colon, otherwise `split(':')` below would
// mis-parse the stored value. Format: encv1:<ivB64>:<ctB64>.
const PREFIX = 'encv1:';

/**
 * Derive a 32-byte key from API_KEY_ENCRYPTION_SECRET (supports passphrases
 * of any length via scrypt). Returns null when the secret is not configured.
 */
function getKey(): Buffer | null {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) return null;
  return crypto.scryptSync(secret, 'contractdiff-apikey-v1', 32);
}

/**
 * Encrypt a third-party API key for at-rest storage. When no encryption secret
 * is configured the key is stored in plaintext and a high-severity warning is
 * emitted (fail-open so the app still runs, but the operator is told).
 *
 * Wire format: `enc:v1:<ivB64>:<ctB64>` — identical to the Web-Crypto format
 * used by the edge/worker backends, so a key written by one backend can be
 * read by any other. The 16-byte GCM auth tag is appended to the ciphertext
 * (the convention used by WinterCG/Worker `crypto.subtle`).
 */
export function encryptApiKey(plain: string): string {
  const key = getKey();
  if (!key) {
    console.warn(
      '[security] API_KEY_ENCRYPTION_SECRET is not set — storing user API keys UNENCRYPTED. Set the secret to enable encryption at rest.'
    );
    return plain;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([ct, tag]); // tag appended, matches Web Crypto
  return PREFIX + iv.toString('base64') + ':' + combined.toString('base64');
}

/**
 * Decrypt a stored API key. Legacy plaintext values (no prefix) are returned
 * unchanged so existing rows keep working until re-saved.
 */
export function decryptApiKey(stored: string | null | undefined): string {
  if (!stored) return '';
  if (!stored.startsWith(PREFIX)) return stored;
  const key = getKey();
  if (!key) {
    console.warn(
      '[security] API_KEY_ENCRYPTION_SECRET is not set — cannot decrypt stored API keys. They will be unavailable until the secret is provided.'
    );
    return '';
  }
  try {
    // Strip the prefix, then the remainder is `<ivB64>:<ctB64>` (tag appended).
    const rest = stored.slice(PREFIX.length);
    const [ivB64, combinedB64] = rest.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const combined = Buffer.from(combinedB64, 'base64');
    const tag = combined.subarray(combined.length - 16);
    const ct = combined.subarray(0, combined.length - 16);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString('utf8');
  } catch {
    return '';
  }
}
