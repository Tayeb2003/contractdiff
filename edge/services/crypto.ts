import { createCrypto } from '../../shared/crypto.js'

// Edge (Wasmer) sources the secret from process.env; the Cloudflare Worker
// backend uses getEnv() — see cf-worker/src/services/crypto.js. The actual
// crypto is shared so the two deployments cannot drift.
const { encryptApiKey, decryptApiKey } = createCrypto(() => process.env.API_KEY_ENCRYPTION_SECRET)

export { encryptApiKey, decryptApiKey }
