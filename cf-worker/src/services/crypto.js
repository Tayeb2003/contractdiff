import { createCrypto } from '../../shared/crypto.js'
import { getEnv } from '../env.js'

// Cloudflare Worker sources the secret from env bindings via getEnv(); the edge
// (Wasmer) backend uses process.env — see edge/services/crypto.ts. The actual
// crypto is shared so the two deployments cannot drift.
const { encryptApiKey, decryptApiKey } = createCrypto(() => getEnv().API_KEY_ENCRYPTION_SECRET)

export { encryptApiKey, decryptApiKey }
