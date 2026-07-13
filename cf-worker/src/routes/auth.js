import { db } from '../db.js'
import { generateToken } from '../jwt.js'
import { hashPassword, comparePassword } from '../password.js'
import { json, parseBody, requireAuth, handleError, AppError } from '../helpers.js'
import { getEnv } from '../env.js'
import { ValidationError, validate } from '../services/validation.js'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000
const ALLOWED_PROVIDERS = ['gemini', 'openai', 'anthropic', 'nvidia']

async function sendResetEmail(email, resetUrl) {
  const env = getEnv()
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) return false
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'noreply@contractdiff.app',
        to: email,
        subject: 'Reset your ContractDiff password',
        text: `We received a request to reset your password. Use the link below to choose a new password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>We received a request to reset your password. Click the link below to choose a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function handleSignup(req) {
  try {
    const body = await parseBody(req)
    validate(body, {
      email: { required: true, email: true },
      password: { required: true, min: 6 },
    })
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [body.email] })
    if (existing.rows.length > 0) return json({ error: 'Email already registered' }, 409)

    const id = crypto.randomUUID()
    const passwordHash = await hashPassword(body.password)
    await db.execute({
      sql: 'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
      args: [id, body.email, passwordHash, body.name || ''],
    })
    const token = await generateToken(id)
    return json({ token, user: { id, email: body.email, name: body.name || '', plan: 'free' } }, 201)
  } catch (err) {
    if (err instanceof ValidationError) return json({ error: err.message }, 400)
    return handleError(err)
  }
}

export async function handleLogin(req) {
  try {
    const body = await parseBody(req)
    validate(body, {
      email: { required: true, email: true },
      password: { required: true },
    })
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [body.email] })
    if (result.rows.length === 0) return json({ error: 'Invalid email or password' }, 401)
    const user = result.rows[0]
    const valid = await comparePassword(body.password, user.password_hash)
    if (!valid) return json({ error: 'Invalid email or password' }, 401)
    const token = await generateToken(user.id)
    return json({
      token,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
    })
  } catch (err) {
    if (err instanceof ValidationError) return json({ error: err.message }, 400)
    return handleError(err)
  }
}

export async function handleMe(req) {
  try {
    const { userId } = await requireAuth(req)
    const result = await db.execute({
      sql: 'SELECT id, email, name, plan, created_at FROM users WHERE id = ?',
      args: [userId],
    })
    if (result.rows.length === 0) return json({ error: 'User not found' }, 404)
    return json({ user: result.rows[0] })
  } catch (err) {
    return handleError(err)
  }
}

export async function handleGetKey(req) {
  try {
    const { userId } = await requireAuth(req)
    const result = await db.execute({
      sql: 'SELECT ai_api_key, ai_provider FROM users WHERE id = ?',
      args: [userId],
    })
    const user = result.rows[0]
    return json({ hasKey: !!user?.ai_api_key, provider: user?.ai_provider || 'gemini' })
  } catch (err) {
    return handleError(err)
  }
}

export async function handlePutKey(req) {
  try {
    const { userId } = await requireAuth(req)
    const body = await parseBody(req)
    if (typeof body.apiKey !== 'string') return json({ error: 'API key is required' }, 400)
    if (!body.apiKey.trim()) {
      await db.execute({
        sql: 'UPDATE users SET ai_api_key = NULL, ai_provider = NULL WHERE id = ?',
        args: [userId],
      })
      return json({ success: true, cleared: true })
    }
    const safeProvider = ALLOWED_PROVIDERS.includes(body.provider) ? body.provider : 'gemini'
    await db.execute({
      sql: 'UPDATE users SET ai_api_key = ?, ai_provider = ? WHERE id = ?',
      args: [body.apiKey.trim(), safeProvider, userId],
    })
    return json({ success: true, provider: safeProvider })
  } catch (err) {
    return handleError(err)
  }
}

export async function handleForgotPassword(req) {
  try {
    const body = await parseBody(req)
    validate(body, { email: { required: true, email: true } })

    const env = getEnv()
    const frontendUrl = env.FRONTEND_URL || env.APP_URL || 'http://localhost:3000'

    const result = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [body.email] })
    if (result.rows.length > 0) {
      const user = result.rows[0]
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()
      await db.execute({
        sql: 'DELETE FROM password_reset_tokens WHERE user_id = ?',
        args: [user.id],
      })
      await db.execute({
        sql: 'INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
        args: [token, user.id, expiresAt],
      })
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`
      const sent = await sendResetEmail(body.email, resetUrl)
      if (sent) {
        return json({ message: 'If an account exists for that email, a reset link has been sent.' })
      }
      return json({
        message: 'If an account exists for that email, a reset link has been generated.',
        devLink: resetUrl,
      })
    }
    return json({ message: 'If an account exists for that email, a reset link has been sent.' })
  } catch (err) {
    if (err instanceof ValidationError) return json({ error: err.message }, 400)
    return handleError(err)
  }
}

export async function handleResetPassword(req) {
  try {
    const body = await parseBody(req)
    validate(body, { token: { required: true }, password: { required: true, min: 6 } })

    const result = await db.execute({
      sql: 'SELECT * FROM password_reset_tokens WHERE token = ?',
      args: [body.token],
    })
    if (result.rows.length === 0) return json({ error: 'Invalid or already-used reset link.' }, 400)
    const record = result.rows[0]
    if (record.used) return json({ error: 'Invalid or already-used reset link.' }, 400)
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return json({ error: 'This reset link has expired. Please request a new one.' }, 400)
    }

    const passwordHash = await hashPassword(body.password)
    await db.execute({
      sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
      args: [passwordHash, record.user_id],
    })
    await db.execute({
      sql: 'UPDATE password_reset_tokens SET used = 1 WHERE token = ?',
      args: [body.token],
    })
    return json({ message: 'Password updated successfully. You can now sign in.' })
  } catch (err) {
    if (err instanceof ValidationError) return json({ error: err.message }, 400)
    return handleError(err)
  }
}
