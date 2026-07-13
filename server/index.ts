import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env before any module that reads process.env
const dotenv = await import('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required. Generate one with `openssl rand -hex 32` and add it to your environment.');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Trust the configured number of reverse-proxy hops so req.ip reflects the real
// client address. Required for accurate per-IP rate limiting behind
// Render/Cloudflare/nginx; without it all clients collapse to the proxy IP.
// Set TRUST_PROXY to the number of trusted hops in front of the app (default 1).
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
}

// CORS — allow the app origin plus any comma-separated ALLOWED_ORIGINS for
// third-party developers. Credentials are only enabled when an EXPLICIT
// allowlist is configured (no `*`), so we never reflect an arbitrary
// request origin together with `Access-Control-Allow-Credentials: true`.
const defaultOrigin = process.env.APP_URL || 'http://localhost:3000';
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = allowed.length ? allowed : [defaultOrigin];
const credentialsEnabled = allowedOrigins.length > 0 && !allowedOrigins.includes('*');

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / non-browser clients
      if (allowedOrigins.includes('*')) return cb(null, true); // public API, no creds
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: credentialsEnabled,
  })
);
app.use(express.json({ limit: '50mb' }));

// Routes — dynamically imported so env vars are available to them
const { default: authRoutes } = await import('./routes/auth.js');
const { default: documentRoutes } = await import('./routes/documents.js');
const { default: analysisRoutes } = await import('./routes/analyses.js');
const { errorHandler } = await import('./middleware/error.js');
const { logger } = await import('./services/logger.js');
const { recoverAnalyses } = await import('./routes/analyses.js');
const openApiSpec = (await import('./openapi.js')).default;

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analyses', analysisRoutes);

// Interactive API documentation (Swagger UI) and raw spec
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'ContractDiff API' }));
app.get('/api/openapi.json', (_req, res) => res.json(openApiSpec));

app.get('/api', (_req, res) => {
  res.json({
    name: 'ContractDiff API',
    version: '1.0.0',
    docs: '/api/docs',
    openapi: '/api/openapi.json',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// In production, serve the built frontend from ../dist
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — any non-API route serves index.html
app.get('*', (_req, res) => {
  if (!_req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);
  // Requeue any analyses left in `processing` by a previous run so they don't
  // stay stuck forever (M2).
  recoverAnalyses();
});
