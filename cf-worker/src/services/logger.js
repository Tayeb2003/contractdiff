import { getEnv } from '../env.js'

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }

function ts() {
  return new Date().toISOString()
}

function log(level, message, meta) {
  const env = getEnv()
  const currentLevel = env.LOG_LEVEL || 'info'
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return

  const entry = { timestamp: ts(), level, message, ...(meta ? { meta } : {}) }
  if (level === 'error') console.error(JSON.stringify(entry))
  else if (level === 'warn') console.warn(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

export const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
}
