import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

const SECRET = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Refusing to generate/verify tokens. Generate a strong random secret and set it in the environment.');
  }
  return secret;
};

interface TokenPayload {
  userId: string;
  exp: number;
}

export function generateToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + 86400 * 7 })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET())
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const expected = crypto
      .createHmac('sha256', SECRET())
      .update(`${parts[0]}.${parts[1]}`)
      .digest();
    // Constant-time comparison to avoid HMAC timing side-channels (CVE-class
    // signature-forgery risk if a plain `===` were used).
    const provided = Buffer.from(parts[2] || '', 'base64url');
    if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as TokenPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const decoded = verifyToken(authHeader.slice(7));
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  (req as AuthenticatedRequest).userId = decoded.userId;
  next();
}
