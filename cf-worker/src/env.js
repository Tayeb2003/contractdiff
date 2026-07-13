let _env = null

export function setEnv(env) {
  _env = env
}

export function getEnv() {
  return _env || {}
}
