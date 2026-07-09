import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env before any module that reads process.env
const dotenv = await import('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow the app origin plus any comma-separated ALLOWED_ORIGINS for third-party developers.
// Set ALLOWED_ORIGINS=* to permit any origin (not recommended for production with credentials).
const defaultOrigin = process.env.APP_URL || 'http://localhost:3000';
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = allowed.length ? allowed : [defaultOrigin];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));

// Routes — dynamically imported so env vars are available to them
const { default: authRoutes } = await import('./routes/auth.js');
const { default: documentRoutes } = await import('./routes/documents.js');
const { default: analysisRoutes } = await import('./routes/analyses.js');
const { errorHandler } = await import('./middleware/error.js');
const { logger } = await import('./services/logger.js');
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
});
