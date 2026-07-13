import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { generateToken, verifyToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../services/validation.js';
import { encryptApiKey } from '../services/crypto.js';
import { rateLimit } from '../middleware/ratelimit.js';

// Brute-force / abuse protection on the auth surface.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts, please try again later.' });
const passwordResetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many password-reset requests, please try again later.' });

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

async function sendResetEmail(email: string, resetUrl: string): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return false;
  }
  try {
    // @ts-ignore - nodemailer is optional and not installed by default
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Reset your ContractDiff password',
      text: `We received a request to reset your password. Use the link below to choose a new password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>We received a request to reset your password. Click the link below to choose a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
    return true;
  } catch {
    return false;
  }
}

router.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response) => {
  try {
    validate(req.body, { email: { required: true, email: true } });
    const { email } = req.body;

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
      db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
      db.prepare(
        'INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)'
      ).run(token, user.id, expiresAt);

      const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
      const sent = await sendResetEmail(email, resetUrl);
      if (!sent) {
        // Never return the reset token/link to the client by default — log it
        // server-side so an operator can deliver it out-of-band. It is only
        // echoed back when RESET_DEV_LINK=true is explicitly set (local dev).
        console.warn(
          `[security] Password reset email not delivered (no SMTP configured). Reset link for user ${user.id}: ${resetUrl}`
        );
        if (process.env.RESET_DEV_LINK === 'true') {
          res.json({
            message: 'If an account exists for that email, a reset link has been generated.',
            devLink: resetUrl,
          });
          return;
        }
      }
      res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
      return;
    }

    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reset-password', (req: Request, res: Response) => {
  try {
    validate(req.body, {
      token: { required: true },
      password: { required: true, min: 6 },
    });
    const { token, password } = req.body;

    const record = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token) as any;
    if (!record || record.used) {
      res.status(400).json({ error: 'Invalid or already-used reset link.' });
      return;
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, record.user_id);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token);

    res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/signup', authLimiter, (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    validate(req.body, {
      email: { required: true, email: true },
      password: { required: true, min: 6 },
    });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(id, email, passwordHash, name || '');
    const token = generateToken(id);
    res.status(201).json({ token, user: { id, email, name: name || '', plan: 'free' } });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', authLimiter, (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    validate(req.body, {
      email: { required: true, email: true },
      password: { required: true },
    });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const user = db.prepare(
    'SELECT id, email, name, plan, created_at FROM users WHERE id = ?'
  ).get(userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

router.get('/key', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const user = db.prepare('SELECT ai_api_key, ai_provider FROM users WHERE id = ?').get(userId) as any;
  res.json({ hasKey: !!user?.ai_api_key, provider: user?.ai_provider || 'gemini' });
});

const ALLOWED_PROVIDERS = ['gemini', 'openai', 'anthropic', 'nvidia'];

router.put('/key', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const { apiKey, provider } = req.body;
  if (typeof apiKey !== 'string') {
    res.status(400).json({ error: 'API key is required' });
    return;
  }
  if (!apiKey.trim()) {
    db.prepare('UPDATE users SET ai_api_key = NULL, ai_provider = NULL WHERE id = ?').run(userId);
    res.json({ success: true, cleared: true });
    return;
  }
  const safeProvider = ALLOWED_PROVIDERS.includes(provider) ? provider : 'gemini';
  db.prepare('UPDATE users SET ai_api_key = ?, ai_provider = ? WHERE id = ?').run(
    encryptApiKey(apiKey.trim()),
    safeProvider,
    userId
  );
  res.json({ success: true, provider: safeProvider });
});

export default router;
