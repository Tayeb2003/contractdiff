import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Bucket>();
// Periodically evict expired buckets so the Map doesn't grow with every
// distinct client over the life of a long-running server.
let sweepCounter = 0;
function sweepExpired(now: number): void {
  if (sweepCounter++ % 1000 !== 0) return;
  for (const [k, b] of windows) {
    if (b.resetAt <= now) windows.delete(k);
  }
}

/**
 * Minimal fixed-window in-memory rate limiter. Sufficient for a single-node
 * deployment of this app. For multi-instance / edge deployments, back this
 * with a shared store (e.g. Redis or Workers KV) — see the worker limiter.
 */
export function rateLimit(opts: {
  windowMs: number;
  max: number;
  key?: (req: Request) => string;
  message?: string;
}) {
  const { windowMs, max } = opts;
  const keyFn = opts.key || ((req: Request) => req.ip || 'unknown');
  const message = opts.message || 'Too many requests, please try again later.';

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.path}:${keyFn(req)}`;
    const now = Date.now();
    sweepExpired(now);
    let bucket = windows.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      windows.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({ error: message });
      return;
    }
    next();
  };
}
