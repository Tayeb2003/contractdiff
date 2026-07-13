// Shared AES-256-GCM helpers for the edge (Wasmer) and Cloudflare Worker
// backends, which both run on the WinterCG/Workers crypto surface. The only
// difference between the two deployments is how the encryption secret is
// sourced, so this module takes a `getSecret` resolver and is imported by both.
// Plain JS (no TS annotations) so it can be bundled by both runtimes and
// syntax-checked with `node --check`.
// The prefix MUST NOT contain a colon, otherwise `split(':')` below would
// mis-parse the stored value. Format: encv1:<ivB64>:<ctB64>.
const PREFIX = 'encv1:'

function bytesToB64(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function b64ToBytes(b64) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function createCrypto(getSecret) {
  async function deriveKey() {
    const secret = getSecret()
    if (!secret) return null
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
    return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  }

  return {
// Encrypt a third-party API key for at-rest storage. Falls back to
    // plaintext with a warning when no API_KEY_ENCRYPTION_SECRET is configured.
    // Format: encv1:<ivB64>:<ctB64> (the GCM auth tag is appended to the ciphertext
    // by the browser/Worker implementation).
    async encryptApiKey(plain) {
      const key = await deriveKey()
      if (!key) {
        console.warn('[security] API_KEY_ENCRYPTION_SECRET is not set — storing user API keys UNENCRYPTED.')
        return plain
      }
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain))
      return PREFIX + bytesToB64(iv) + ':' + bytesToB64(new Uint8Array(ct))
    },

    // Decrypt a stored API key. Plaintext (legacy) values are returned unchanged.
    async decryptApiKey(stored) {
      if (!stored) return ''
      if (!stored.startsWith(PREFIX)) return stored
      const key = await deriveKey()
      if (!key) {
        console.warn('[security] API_KEY_ENCRYPTION_SECRET is not set — cannot decrypt stored API keys.')
        return ''
      }
      try {
        // Strip the prefix, then the remainder is `<ivB64>:<ctB64>` (tag appended).
        const rest = stored.slice(PREFIX.length)
        const [ivB64, ctB64] = rest.split(':')
        const iv = b64ToBytes(ivB64)
        const ct = b64ToBytes(ctB64)
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
        return new TextDecoder().decode(pt)
      } catch {
        return ''
      }
    },

    // Decrypt a stored API key. Plaintext (legacy) values are returned unchanged.
    async decryptApiKey(stored) {
      if (!stored) return ''
      if (!stored.startsWith(PREFIX)) return stored
      const key = await deriveKey()
      if (!key) {
        console.warn('[security] API_KEY_ENCRYPTION_SECRET is not set — cannot decrypt stored API keys.')
        return ''
      }
      try {
        const [, ivB64, ctB64] = stored.split(':')
        const iv = b64ToBytes(ivB64)
        const ct = b64ToBytes(ctB64)
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
        return new TextDecoder().decode(pt)
      } catch {
        return ''
      }
    },
  }
}
