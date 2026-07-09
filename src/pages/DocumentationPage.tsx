import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Key,
  Terminal,
  FileCode,
  Shield,
  Server,
  AlertTriangle,
  Download,
  Lock,
  Trash2,
  HeartPulse,
  BookOpen,
} from 'lucide-react';

// Replace https://your-server.com with your actual server URL.
// If running locally, use http://localhost:3001
const BASE = 'https://your-server.com';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface Endpoint {
  method: Method;
  path: string;
  auth: boolean;
  description: string;
  request: string;
  response: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/auth/signup',
    auth: false,
    description:
      'Create a new account. Returns a JWT token and the user object. Passwords must be at least 6 characters. Each user gets an isolated workspace.',
    request: `curl -X POST ${BASE}/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "you@example.com",
    "password": "yourpassword",
    "name": "Your Name"
  }'`,
    response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "you@example.com",
    "name": "Your Name",
    "plan": "free"
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    auth: false,
    description: 'Authenticate existing credentials and receive a JWT token.',
    request: `curl -X POST ${BASE}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "you@example.com",
    "password": "yourpassword"
  }'`,
    response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "you@example.com",
    "name": "Your Name",
    "plan": "free"
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    auth: true,
    description: "Retrieve the currently authenticated user's profile.",
    request: `curl ${BASE}/api/auth/me \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    response: `{
  "user": {
    "id": "uuid",
    "email": "you@example.com",
    "name": "Your Name",
    "plan": "free",
    "created_at": "2026-07-01T12:00:00.000Z"
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/auth/key',
    auth: true,
    description:
      'Check whether the authenticated user has stored their own AI provider key in Settings. Does not expose the key itself.',
    request: `curl ${BASE}/api/auth/key \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    response: `{
  "hasKey": true,
  "provider": "gemini"
}`,
  },
  {
    method: 'PUT',
    path: '/api/auth/key',
    auth: true,
    description:
      'Store (or clear) the authenticated user\u2019s AI provider key. Pass an empty string to remove it. Allowed providers: gemini, openai, anthropic, nvidia. Defaults to gemini.',
    request: `curl -X PUT ${BASE}/api/auth/key \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "AIzaSyD-your-key-here",
    "provider": "gemini"
  }'`,
    response: `{
  "success": true,
  "provider": "gemini"
}`,
  },
  {
    method: 'POST',
    path: '/api/auth/forgot-password',
    auth: false,
    description:
      'Request a password reset link. Always returns 200 to avoid leaking which emails are registered. If SMTP is configured the link is emailed; otherwise the response includes a devLink for local testing.',
    request: `curl -X POST ${BASE}/api/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "you@example.com" }'`,
    response: `{
  "message": "If an account exists for that email, a reset link has been sent."
}`,
  },
  {
    method: 'POST',
    path: '/api/auth/reset-password',
    auth: false,
    description:
      'Submit a new password using the token from the reset link. Tokens expire after 1 hour and can only be used once.',
    request: `curl -X POST ${BASE}/api/auth/reset-password \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "TOKEN_FROM_RESET_EMAIL",
    "password": "newpassword"
  }'`,
    response: `{
  "message": "Password updated successfully. You can now sign in."
}`,
  },
  {
    method: 'POST',
    path: '/api/documents/upload',
    auth: true,
    description:
      'Upload a contract file. Supported formats: PDF, DOCX, TXT. Max file size: 20 MB. The file is parsed server-side and the extracted text is stored. Data is scoped per user.',
    request: `curl -X POST ${BASE}/api/documents/upload \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F "file=@contract.pdf"`,
    response: `{
  "id": "uuid",
  "originalName": "contract.pdf",
  "docType": "application/pdf",
  "contentLength": 45231
}`,
  },
  {
    method: 'POST',
    path: '/api/documents/paste',
    auth: true,
    description: 'Submit contract text directly without uploading a file. Title is optional (max 500 chars).',
    request: `curl -X POST ${BASE}/api/documents/paste \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "NDA v1",
    "content": "This agreement is made on..."
  }'`,
    response: `{
  "id": "uuid",
  "originalName": "NDA v1",
  "docType": "text/plain",
  "contentLength": 1240
}`,
  },
  {
    method: 'GET',
    path: '/api/documents',
    auth: true,
    description: 'List all uploaded documents for the authenticated user, ordered by most recent.',
    request: `curl ${BASE}/api/documents \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    response: `{
  "documents": [
    {
      "id": "uuid",
      "original_name": "contract.pdf",
      "doc_type": "application/pdf",
      "upload_date": "2026-07-01T12:00:00.000Z"
    }
  ]
}`,
  },
  {
    method: 'DELETE',
    path: '/api/documents/:id',
    auth: true,
    description:
      'Delete a document. Cascades: any analyses that reference this document (as either side) are also deleted.',
    request: `curl -X DELETE ${BASE}/api/documents/DOCUMENT_UUID \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    response: `{
  "success": true
}`,
  },
  {
    method: 'POST',
    path: '/api/analyses/create',
    auth: true,
    description:
      'Create a new comparison analysis from two uploaded document IDs. The user must have set their own AI key in Settings first (see PUT /api/auth/key). Runs asynchronously — poll GET /api/analyses/:id until status is "completed" or "failed".',
    request: `curl -X POST ${BASE}/api/analyses/create \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "docAId": "DOCUMENT_A_UUID",
    "docBId": "DOCUMENT_B_UUID"
  }'`,
    response: `{
  "analysisId": "uuid",
  "status": "processing"
}`,
  },
  {
    method: 'GET',
    path: '/api/analyses',
    auth: true,
    description: 'List all analyses for the authenticated user, ordered by most recent.',
    request: `curl ${BASE}/api/analyses \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    response: `{
  "analyses": [
    {
      "id": "uuid",
      "status": "completed",
      "summary": "The new version shifts liability...",
      "created_at": "2026-07-01T12:00:00Z",
      "doc_a_name": "nda_v1.pdf",
      "doc_b_name": "nda_v2.pdf"
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/analyses/:id',
    auth: true,
    description:
      'Retrieve a specific analysis with all clause diffs and the AI-generated summary. Includes the original document contents for side-by-side rendering.',
    request: `curl ${BASE}/api/analyses/ANALYSIS_UUID \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    response: `{
  "analysis": {
    "id": "uuid",
    "status": "completed",
    "summary": "The new version shifts liability...",
    "createdAt": "2026-07-01T12:00:00Z",
    "docAName": "nda_v1.pdf",
    "docBName": "nda_v2.pdf",
    "docAContent": "...",
    "docBContent": "..."
  },
  "clauses": [
    {
      "id": "uuid",
      "clause_text_before": "Liability shall be capped at USD 100,000.",
      "clause_text_after": "Neither party shall have any limitation of liability.",
      "plain_english_summary": "This clause removes your cap on liability...",
      "favors": "party_b",
      "severity": "major"
    }
  ]
}`,
  },
  {
    method: 'DELETE',
    path: '/api/analyses/:id',
    auth: true,
    description: 'Delete an analysis and all of its clause diffs.',
    request: `curl -X DELETE ${BASE}/api/analyses/ANALYSIS_UUID \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
    response: `{
  "success": true
}`,
  },
  {
    method: 'GET',
    path: '/api/health',
    auth: false,
    description: 'Liveness probe. No auth required. Use this for uptime checks and container health checks.',
    request: `curl ${BASE}/api/health`,
    response: `{
  "status": "ok"
}`,
  },
  {
    method: 'GET',
    path: '/api',
    auth: false,
    description: 'API index. Lists available meta endpoints (docs, openapi spec, health).',
    request: `curl ${BASE}/api`,
    response: `{
  "name": "ContractDiff API",
  "version": "1.0.0",
  "docs": "/api/docs",
  "openapi": "/api/openapi.json",
  "health": "/api/health"
}`,
  },
];

const toc = [
  {
    group: 'Getting Started',
    items: [
      { id: 'architecture', label: 'Architecture' },
      { id: 'prerequisites', label: 'Prerequisites' },
      { id: 'quickstart', label: 'Quick Start' },
      { id: 'byok', label: 'AI Provider Keys' },
      { id: 'env', label: 'Environment Variables' },
    ],
  },
  {
    group: 'API Reference',
    items: [
      { id: 'auth', label: 'Authentication' },
      { id: 'endpoints', label: 'Endpoints' },
      { id: 'customkeys', label: 'Per-User Keys' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { id: 'errors', label: 'Error Codes' },
      { id: 'limitations', label: 'Known Limitations' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Small presentational helpers
// ─────────────────────────────────────────────────────────────────────────────

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-5">
      <span className="text-mint mt-1 shrink-0">{icon}</span>
      <h2 className="text-2xl font-serif mb-6 text-metallic">{children}</h2>
    </div>
  );
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#0a0a0a] border border-mint/10 p-4 md:p-6 font-mono text-sm overflow-x-auto whitespace-pre-wrap break-words">
      {children}
    </div>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return <code className="text-mint bg-mint/10 px-1.5 py-0.5 text-sm">{children}</code>;
}

function MethodBadge({ method }: { method: Method }) {
  const styles: Record<Method, string> = {
    GET: 'text-mint border-mint/40',
    POST: 'text-white border-mint/60 bg-mint/10',
    PUT: 'text-yellow-200 border-yellow-400/40 bg-yellow-400/5',
    DELETE: 'text-red-300 border-red-400/40 bg-red-400/5',
  };
  return (
    <span className={`text-xs font-mono font-bold px-3 py-1.5 border ${styles[method]}`}>
      {method}
    </span>
  );
}

export default function DocumentationPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 relative z-10">
      <div className="px-6 md:px-12 max-w-6xl mx-auto w-full lg:flex lg:gap-16">
        {/* ── Sticky Table of Contents ── */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-32">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] opacity-70 hover:opacity-100 mb-10 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" /> Back Home
            </Link>
            {toc.map((group) => (
              <div key={group.group} className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-mint/50 mb-3">{group.group}</p>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-sm opacity-70 hover:opacity-100 hover:text-mint transition-opacity"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <Link
            to="/"
            className="lg:hidden inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] opacity-70 hover:opacity-100 mb-12 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Link>

          {/* ── Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-24"
          >
            <span className="text-xs uppercase tracking-[0.3em] text-mint/60 mb-6 block">
              API Reference
            </span>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-8 text-metallic">
              Integrate ContractDiff
            </h1>
            <p className="text-lg md:text-xl font-normal text-body leading-relaxed max-w-3xl">
              ContractDiff is a self-hosted REST API. You deploy the server on your own
              infrastructure, users authenticate via JWT to upload contracts, and the engine
              returns AI-powered clause-by-clause analysis. Every user's data is scoped to their
              account. An interactive Swagger UI is also served at{' '}
              <InlineCode>/api/docs</InlineCode> once the server is running.
            </p>
          </motion.div>

          {/* ── Architecture ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            id="architecture"
            className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-8 scroll-mt-40"
          >
            {[
              {
                icon: <Download className="w-10 h-10 mx-auto mb-5 text-mint" strokeWidth={1} />,
                title: '1. Get the Code',
                body: (
                  <>
                    Clone the repository and run <InlineCode>npm install</InlineCode>.
                    Configure your environment in <InlineCode>.env.local</InlineCode>.
                  </>
                ),
              },
              {
                icon: <Server className="w-10 h-10 mx-auto mb-5 text-mint" strokeWidth={1} />,
                title: '2. Start the Server',
                body: (
                  <>
                    Run <InlineCode>npm run dev:server</InlineCode> for development or build and
                    deploy to production. SQLite is created automatically on first run.
                  </>
                ),
              },
              {
                icon: <Terminal className="w-10 h-10 mx-auto mb-5 text-mint" strokeWidth={1} />,
                title: '3. Hit the API',
                body: <>Authenticate, upload documents, create analyses, and poll for results — all via HTTP.</>,
              },
            ].map((card) => (
              <div key={card.title} className="border border-mint/10 p-6 md:p-8 text-center">
                {card.icon}
                <h3 className="text-lg font-serif mb-3 uppercase tracking-wide text-metallic">
                  {card.title}
                </h3>
                <p className="font-normal text-body text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </motion.div>

          {/* ── Prerequisites ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.13 }}
            id="prerequisites"
            className="mb-20 p-8 md:p-10 border border-mint/20 bg-mint/5 scroll-mt-40"
          >
            <SectionTitle icon={<Server className="w-6 h-6" strokeWidth={1} />}>Prerequisites</SectionTitle>
            <p className="font-normal text-body leading-relaxed mb-6 ml-11">Before you start, make sure you have:</p>
            <ul className="space-y-4 ml-11">
              {[
                ['Node.js', 'v18 or higher installed on your machine or server.'],
                ['npm', 'Comes with Node.js — used to install dependencies.'],
                ['Git', 'To clone the repository.'],
                [
                  'An AI Provider Key',
                  'Powers clause interpretation and plain-English summaries. Each user pastes their own Google Gemini, OpenAI, Anthropic, or NVIDIA NIM key in Settings (see Per-User Keys).',
                ],
                [
                  'A Server (production)',
                  'A VPS, cloud VM (AWS, DigitalOcean, Railway), or Docker host to run the backend.',
                ],
                [
                  'Build Tools',
                  'Required to compile <code className="text-mint bg-mint/10 px-1">better-sqlite3</code> during <code className="text-mint bg-mint/10 px-1">npm install</code>. On macOS: Xcode Command Line Tools (<code className="text-mint bg-mint/10 px-1">xcode-select --install</code>). On Linux: <code className="text-mint bg-mint/10 px-1">build-essential</code> + Python. On Windows: Visual Studio Build Tools + Python.',
                ],
              ].map(([label, desc], i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="text-mint text-lg leading-none mt-0.5">•</span>
                  <div>
                    <span className="font-medium text-sm text-mint">{label}</span>
                    <span className="text-body text-sm"> — {desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ── Quick Start ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            id="quickstart"
            className="mb-20 p-8 md:p-10 border border-mint/20 scroll-mt-40"
          >
            <SectionTitle icon={<Terminal className="w-6 h-6" strokeWidth={1} />}>Quick Start (Local Development)</SectionTitle>
            <div className="ml-11">
              <CodeBlock>
                <code className="block text-mint/80 mb-2"><span className="opacity-50">{'# Clone the repository'}</span></code>
                <code className="block text-mint/80 mb-2">{'git clone <repository-url> contractdiff'}</code>
                <code className="block text-mint/80 mb-2">cd contractdiff</code>
                <code className="block text-mint/80 mb-3"><span className="opacity-50">{'# Install dependencies (requires build tools — see Prerequisites)'}</span></code>
                <code className="block text-mint/80 mb-2">npm install</code>
                <code className="block text-mint/80 mb-3"><span className="opacity-50">{'# Set up environment'}</span></code>
                <code className="block text-mint/80 mb-2">{'# macOS / Linux'}</code>
                <code className="block text-mint/80 mb-2">cp .env.example .env.local</code>
                <code className="block text-mint/80 mb-2">{'# Windows'}</code>
                <code className="block text-mint/80 mb-3">copy .env.example .env.local</code>
                <code className="block text-mint/80 mb-3"><span className="opacity-50">{'# Edit .env.local — set JWT_SECRET and optionally a server-level AI key'}</span></code>
                <code className="block text-mint/80 mb-3"><span className="opacity-50">{'# Start both frontend + backend together'}</span></code>
                <code className="block text-mint/80 mb-2">npm run dev</code>
                <code className="block text-mint/80 mb-3"><span className="opacity-50">{'# ...or run them separately'}</span></code>
                <code className="block text-mint/80 mb-2">{'npm run dev:server   # backend on :3001'}</code>
                <code className="block text-mint/80">{'npm run dev:frontend # frontend on :3000'}</code>
              </CodeBlock>
              <p className="font-normal text-body text-sm leading-relaxed mt-4">
                The database (SQLite via <InlineCode>better-sqlite3</InlineCode>) is created
                automatically on first run. Swagger UI becomes available at{' '}
                <InlineCode>http://localhost:3001/api/docs</InlineCode>.
              </p>
            </div>
          </motion.div>

          {/* ── AI Key Requirement ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.19 }}
            id="ai-service"
            className="mb-20 p-8 md:p-10 border border-yellow-400/30 bg-yellow-400/5 scroll-mt-40"
          >
            <div className="flex items-start gap-5">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1 shrink-0" strokeWidth={1.5} />
              <div>
                <h2 className="text-2xl font-serif mb-4 text-yellow-300">AI Service — Per-User Keys</h2>
                <p className="font-normal text-body leading-relaxed mb-4">
                  Clause analysis (diffing, severity scoring, plain-English summaries) uses an AI
                  provider <strong>each user supplies</strong> — Google Gemini, OpenAI, Anthropic,
                  or NVIDIA NIM. The server calls the provider's API with the user's key, which
                  they store via <InlineCode>PUT /api/auth/key</InlineCode> (or in the Settings page).
                </p>
                <p className="font-normal text-body leading-relaxed mb-4">
                  Without a personal key set, creating an analysis returns a <InlineCode>400</InlineCode>{' '}
                  error. Auth, uploads, deletion, and listing still work without one.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-3 text-sm font-normal text-body">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>The server starts and handles auth, uploads, listing, and deletion without any AI key.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-normal text-body">
                    <span className="text-yellow-400 mt-0.5">⚠</span>
                    <span>Analysis creation (<InlineCode>POST /api/analyses/create</InlineCode>) requires the user to have set their own key first.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-normal text-body">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Keys are stored encrypted-at-rest by the database and called only from the server — never exposed to the browser.</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* ── Bring Your Own Key ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.21 }}
            id="byok"
            className="mb-20 p-8 md:p-10 border border-mint/20 scroll-mt-40"
          >
            <SectionTitle icon={<Key className="w-6 h-6" strokeWidth={1} />}>Bring Your Own API Key</SectionTitle>
            <div className="ml-11 w-full">
              <p className="font-normal text-body leading-relaxed mb-8">
                Users supply their own provider key through the <strong>Settings</strong> page or
                the <InlineCode>PUT /api/auth/key</InlineCode> endpoint. Pick one provider — Google
                Gemini, OpenAI, Anthropic, or NVIDIA NIM — and paste the key.
              </p>

              <h3 className="text-sm uppercase tracking-[0.2em] text-mint/60 mb-4">1. Choose a provider & grab a key</h3>

              {[
                {
                  name: 'Google Gemini',
                  envVar: 'GEMINI_API_KEY',
                  sample: 'AIzaSyD-your-key-here',
                  url: 'https://aistudio.google.com/apikey',
                  note: 'Default model: gemini-2.0-flash',
                },
                {
                  name: 'OpenAI',
                  envVar: 'OPENAI_API_KEY',
                  sample: 'sk-your-key-here',
                  url: 'https://platform.openai.com/api-keys',
                  note: 'Default model: gpt-4o-mini (override with OPENAI_MODEL)',
                },
                {
                  name: 'Anthropic',
                  envVar: 'ANTHROPIC_API_KEY',
                  sample: 'sk-ant-your-key-here',
                  url: 'https://console.anthropic.com/settings/keys',
                  note: 'Default model: claude-3-5-sonnet-latest (override with ANTHROPIC_MODEL)',
                },
                {
                  name: 'NVIDIA NIM',
                  envVar: 'NVIDIA_API_KEY',
                  sample: 'nvapi-your-key-here',
                  url: 'https://build.nvidia.com/',
                  note: 'Default model: meta/llama-3.3-70b-instruct (override with NVIDIA_MODEL)',
                },
              ].map((p, idx, arr) => (
                <div key={p.envVar} className={idx < arr.length - 1 ? 'mb-6' : 'mb-8'}>
                  <p className="text-sm font-medium text-mint mb-2">{p.name}</p>
                  <CodeBlock>
                    <code className="block text-mint/80 mb-2">
                      <span className="opacity-50">{'# macOS / Linux (bash)'}</span>
                    </code>
                    <code className="block text-mint/80 mb-2">export {p.envVar}="{p.sample}"</code>
                    <code className="block text-mint/80 mb-2">
                      <span className="opacity-50">{'# Windows (PowerShell)'}</span>
                    </code>
                    <code className="block text-mint/80 mb-2">$env:{p.envVar}="{p.sample}"</code>
                    <code className="block text-mint/80 mb-2">
                      <span className="opacity-50">{'# Windows (CMD)'}</span>
                    </code>
                    <code className="block text-mint/80">set {p.envVar}={p.sample}</code>
                  </CodeBlock>
                  <p className="text-xs text-body mt-2">
                    Get a key at <InlineCode>{p.url}</InlineCode> — {p.note}
                  </p>
                </div>
              ))}

              <h3 className="text-sm uppercase tracking-[0.2em] text-mint/60 mb-4">2. Or store it via the API (per-user)</h3>
              <CodeBlock>
                <code className="block text-mint/80 mb-2">
                  <span className="opacity-50">{'# Store a key for the authenticated user'}</span>
                </code>
                <code className="block text-mint/80 mb-2">{'curl -X PUT '}{BASE}{'/api/auth/key \\'}</code>
                <code className="block text-mint/80 mb-2">{'  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\'}</code>
                <code className="block text-mint/80 mb-2">{'  -H "Content-Type: application/json" \\'}</code>
                <code className="block text-mint/80 mb-2">{"  -d '{\"apiKey\":\"AIzaSyD-...\", \"provider\":\"gemini\"}'"}</code>
                <code className="block text-mint/80 mb-3">&nbsp;</code>
                <code className="block text-mint/80 mb-2">
                  <span className="opacity-50">{'# Clear it later (pass empty string)'}</span>
                </code>
                <code className="block text-mint/80">{'curl -X PUT '}{BASE}{'/api/auth/key -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d ' + "'{\"apiKey\":\"\"}'"}</code>
              </CodeBlock>
              <p className="text-xs text-body mt-2">
                <span className="opacity-70">Windows CMD users: replace trailing </span>
                <code className="text-mint bg-mint/10 px-1">\</code>
                <span className="opacity-70"> with </span>
                <code className="text-mint bg-mint/10 px-1">^</code>
                <span className="opacity-70"> for line continuation, or paste the whole command as a single line.</span>
              </p>

              <div className="flex items-start gap-3 text-sm text-body mt-6">
                <Shield className="w-4 h-4 text-mint mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>
                  Keys are called <strong>only from the server</strong>, never exposed to the
                  browser. Each user's key is used only for their own analyses.
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Environment Variables ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            id="env"
            className="mb-20 scroll-mt-40"
          >
            <SectionTitle icon={<Server className="w-6 h-6" strokeWidth={1} />}>Environment Variables</SectionTitle>
            <div className="ml-11">
              <p className="font-normal text-body mb-6 max-w-3xl">
                Copy <InlineCode>.env.example</InlineCode> to <InlineCode>.env.local</InlineCode> and configure.
                Only <InlineCode>PORT</InlineCode>, <InlineCode>APP_URL</InlineCode>, and{' '}
                <InlineCode>JWT_SECRET</InlineCode> are required for the server to run.
              </p>
              <CodeBlock>
                <pre className="text-mint/80">{`# ── Server ──────────────────────────────────────────
PORT=3001
# Frontend URL (used for CORS — change in production)
APP_URL=http://localhost:3000
# Optional: comma-separated extra allowed CORS origins (or * for any)
# ALLOWED_ORIGINS=https://app.example.com,https://staging.example.com

# ── Auth ────────────────────────────────────────────
# Generate a strong random string for production
JWT_SECRET=contractdiff-dev-secret-change-in-production

# ── AI Providers (optional server-level, see BYOK) ──
# Priority if multiple set: GEMINI -> OPENAI -> ANTHROPIC -> NVIDIA
GEMINI_API_KEY=
OPENAI_API_KEY=
# OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=
# ANTHROPIC_MODEL=claude-3-5-sonnet-latest
NVIDIA_API_KEY=
# NVIDIA_MODEL=meta/llama-3.3-70b-instruct

# ── Email (optional — enables password reset) ───────
# SMTP_HOST=smtp.mailtrap.io
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM=`}</pre>
              </CodeBlock>
              <div className="flex items-start gap-3 text-sm text-body mt-6">
                <Shield className="w-4 h-4 text-mint mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>
                  The <InlineCode>JWT_SECRET</InlineCode> signs auth tokens — change it for
                  production. <InlineCode>APP_URL</InlineCode> controls which origin can make
                  cross-origin requests. SMTP settings are optional and only enable the
                  forgot-password email flow.
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Authentication ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            id="auth"
            className="mb-20 p-8 md:p-10 border border-mint/20 scroll-mt-40"
          >
            <SectionTitle icon={<Lock className="w-6 h-6" strokeWidth={1} />}>Authentication</SectionTitle>
            <div className="ml-11">
              <p className="font-normal text-body leading-relaxed mb-6">
                All protected endpoints require a JWT token passed via the{' '}
                <InlineCode>Authorization</InlineCode> header. Each user signs up or logs in to get
                their own token. Every database query filters by{' '}
                <InlineCode>user_id</InlineCode> — users cannot access each other's data.
              </p>
              <CodeBlock>
                <code className="block text-mint/80">Authorization: Bearer eyJhbGciOiJIUzI1NiIs...</code>
              </CodeBlock>
              <p className="font-normal text-body text-sm leading-relaxed mt-4">
                Tokens do not expire server-side (rotate by changing <InlineCode>JWT_SECRET</InlineCode>).
                Obtain one from <InlineCode>POST /api/auth/signup</InlineCode> or{' '}
                <InlineCode>POST /api/auth/login</InlineCode>.
              </p>
            </div>
          </motion.div>

          {/* ── Endpoints ── */}
          <div id="endpoints" className="mb-20 scroll-mt-40">
            <SectionTitle icon={<FileCode className="w-6 h-6" strokeWidth={1} />}>Endpoints</SectionTitle>
            <div className="ml-11 space-y-16">
              {endpoints.map((ep, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <MethodBadge method={ep.method} />
                    <code className="text-lg font-mono text-mint/90 break-all">{ep.path}</code>
                    {ep.auth ? (
                      <span className="ml-auto text-xs uppercase tracking-[0.2em] text-mint/40 flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> Auth
                      </span>
                    ) : (
                      <span className="ml-auto text-xs uppercase tracking-[0.2em] text-body/40">
                        Public
                      </span>
                    )}
                  </div>
                  <p className="font-normal text-body mb-6 max-w-3xl">{ep.description}</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] opacity-50">
                        <Terminal className="w-3.5 h-3.5" strokeWidth={1.5} /> Request
                      </div>
                      <CodeBlock>
                        <pre className="text-mint/80">{ep.request}</pre>
                      </CodeBlock>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] opacity-50">
                        <FileCode className="w-3.5 h-3.5" strokeWidth={1.5} /> Response
                      </div>
                      <CodeBlock>
                        <pre className="text-mint/80">{ep.response}</pre>
                      </CodeBlock>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Per-User Keys ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            id="customkeys"
            className="mb-20 p-8 md:p-10 border border-mint/20 bg-mint/5 scroll-mt-40"
          >
            <SectionTitle icon={<Key className="w-6 h-6" strokeWidth={1} />}>Per-User Keys</SectionTitle>
            <div className="ml-11">
              <p className="font-normal text-body leading-relaxed mb-6">
                Each authenticated user stores their own AI provider key, used only for their own
                analyses. Two endpoints manage this — neither ever returns the key value back.
              </p>
              <div className="space-y-4">
                <CodeBlock>
                  <code className="block text-mint/80 mb-2"><span className="opacity-50">{'# Check whether a key is set'}</span></code>
                  <code className="block text-mint/80 mb-2">{'curl ' + BASE + '/api/auth/key -H "Authorization: Bearer YOUR_JWT_TOKEN"'}</code>
                  <code className="block text-mint/80 mb-3">&nbsp;</code>
                  <code className="block text-mint/80 mb-2"><span className="opacity-50">{'# {"hasKey":true,"provider":"gemini"}'}</span></code>
                </CodeBlock>
                <CodeBlock>
                  <code className="block text-mint/80 mb-2"><span className="opacity-50">{'# Store or replace the key'}</span></code>
                  <code className="block text-mint/80 mb-2">{'curl -X PUT ' + BASE + '/api/auth/key \\'}</code>
                  <code className="block text-mint/80 mb-2">{'  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\'}</code>
                  <code className="block text-mint/80 mb-2">{'  -H "Content-Type: application/json" \\'}</code>
                  <code className="block text-mint/80 mb-2">{"  -d '{\"apiKey\":\"sk-...\", \"provider\":\"openai\"}'"}</code>
                  <code className="block text-mint/80 mb-3">&nbsp;</code>
                  <code className="block text-mint/80"><span className="opacity-50">{'# {"success":true,"provider":"openai"}'}</span></code>
                </CodeBlock>
              </div>
              <p className="font-normal text-body text-sm leading-relaxed mt-4">
                Allowed providers: <InlineCode>gemini</InlineCode>, <InlineCode>openai</InlineCode>,{' '}
                <InlineCode>anthropic</InlineCode>, <InlineCode>nvidia</InlineCode>. An empty{' '}
                <InlineCode>apiKey</InlineCode> clears the stored key.
              </p>
            </div>
          </motion.div>

          {/* ── Known Limitations ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            id="limitations"
            className="mb-20 p-8 md:p-10 border border-yellow-400/20 scroll-mt-40"
          >
            <div className="flex items-start gap-5">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1 shrink-0" strokeWidth={1.5} />
              <div>
                <h2 className="text-2xl font-serif mb-4 text-yellow-300">Known Limitations</h2>
                <p className="font-normal text-body leading-relaxed mb-6">
                  These are <strong>not yet implemented</strong> in the current server. Be aware when
                  planning your integration:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    ['No pagination', 'List endpoints return all results at once'],
                    ['No webhooks', 'Clients must poll for analysis completion'],
                    ['No rate limiting', 'No throttle on request volume'],
                    ['No public API keys', 'Only JWT token auth (requires user login)'],
                    ['No file sanitization', 'Uploads are parsed but not virus-scanned'],
                    ['No HTTPS by default', 'Requires a reverse proxy (nginx/Caddy) in production'],
                    ['SQLite only', 'Single-node — not designed for horizontal scaling'],
                    ['No token expiry', 'JWTs do not expire server-side'],
                  ].map(([title, desc], i) => (
                    <div key={i} className="flex items-start gap-3 py-2">
                      <span className="text-yellow-400 text-xs mt-0.5">⚠</span>
                      <div>
                        <span className="text-sm font-medium text-mint">{title}</span>
                        <p className="text-xs text-body">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Error Codes ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.05 }}
            id="errors"
            className="mb-20 border border-mint/10 p-8 scroll-mt-40"
          >
            <SectionTitle icon={<AlertTriangle className="w-6 h-6" strokeWidth={1} />}>Error Codes</SectionTitle>
            <ul className="ml-11 space-y-3 text-sm font-mono">
              {[
                ['400', 'Bad Request', 'Missing or invalid request body / validation failure'],
                ['401', 'Unauthorized', 'Missing or invalid JWT token'],
                ['404', 'Not Found', 'Resource does not exist or belongs to another user'],
                ['409', 'Conflict', 'Email already registered'],
                ['413', 'File Too Large', 'Document exceeds the 20 MB limit'],
                ['500', 'Server Error', 'Internal failure — check server logs'],
              ].map(([code, title, desc], i) => (
                <li key={i} className="flex items-start gap-3 font-normal text-body">
                  <span className="text-mint shrink-0 w-10">{code}</span>
                  <span className="opacity-60">—</span>
                  <div>
                    <span className="opacity-90 text-mint">{title}</span>
                    <span className="text-body"> — {desc}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="ml-11 mt-6 text-xs text-body font-normal">
              All errors are returned as JSON: <InlineCode>{'{"error":"..."}'}</InlineCode>. The
              forgot-password endpoint intentionally always returns 200 to avoid account enumeration.
            </p>
          </motion.div>

          {/* ── Interactive Docs note ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.08 }}
            className="mb-20 p-8 border border-mint/10 bg-mint/5 scroll-mt-40 flex items-start gap-5"
          >
            <BookOpen className="w-6 h-6 text-mint mt-1 shrink-0" strokeWidth={1} />
            <div>
              <h3 className="text-lg font-serif mb-2 text-metallic">Interactive API Explorer</h3>
              <p className="font-normal text-body text-sm leading-relaxed mb-4">
                Once the server is running, an interactive Swagger UI is available in-browser — no
                need to copy curl commands by hand. Also try the liveness probe for health checks.
              </p>
              <div className="flex flex-wrap gap-6 text-xs font-mono text-body">
                <span className="flex items-center gap-2"><BookOpen className="w-3 h-3 text-mint" /> http://localhost:3001/api/docs</span>
                <span className="flex items-center gap-2"><FileCode className="w-3 h-3 text-mint" /> http://localhost:3001/api/openapi.json</span>
                <span className="flex items-center gap-2"><HeartPulse className="w-3 h-3 text-mint" /> http://localhost:3001/api/health</span>
              </div>
            </div>
          </motion.div>

          {/* ── CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="text-center border-t border-mint/10 pt-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl mb-6 text-metallic">Ready to run it yourself?</h2>
            <p className="text-lg font-normal text-body mb-10 max-w-lg mx-auto">
              Clone the repo, set your JWT secret, start the server — and your API is live.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                to="/upload"
                className="px-10 py-4 bg-mint text-black font-medium uppercase tracking-[0.2em] text-sm hover:bg-white transition-colors"
              >
                Try the Frontend
              </Link>
              <Link
                to="/#contact"
                className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] border-b border-mint pb-1 hover:text-white hover:border-white transition-colors"
              >
                Get Help <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
