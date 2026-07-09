# ContractDiff

Self-hosted contract comparison tool with AI-powered clause analysis.

Upload two versions of a contract and get a side-by-side diff with plain-English explanations of what changed, severity ratings, and party-favour analysis.

## Quick Start

```bash
git clone <repo-url> contractdiff
cd contractdiff
npm install
cp .env.example .env.local
# Edit .env.local — add GEMINI_API_KEY for AI analysis
npm run dev
```

This starts both the frontend (`http://localhost:3000`) and API server (`http://localhost:3001`) in one terminal. To run them separately:

```bash
npm run dev:frontend  # frontend only
npm run dev:server    # backend only
```

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + motion
- **Backend**: Express + TypeScript + better-sqlite3
- **AI**: Google Gemini (with local fallback when no API key is set)

## Project Structure

```
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route pages (Home, Features, Pricing, Docs, Contact, Documentation)
│   └── App.tsx             # Routing and layout
├── server/                 # Express backend
│   ├── routes/             # auth, documents, analyses
│   ├── services/           # ai, differ, parser
│   ├── middleware/          # JWT auth
│   ├── db.ts               # SQLite init
│   └── index.ts            # Server entry point
├── public/                 # Static assets
├── uploads/                # Uploaded files
└── .env.example            # Environment config template
```

## Environment Variables

| Variable         | Required | Description                                       |
|------------------|----------|---------------------------------------------------|
| `PORT`           | No       | Server port (default: 3001)                       |
| `APP_URL`        | No       | Frontend URL for CORS (default: http://localhost:3000) |
| `JWT_SECRET`     | Yes      | Secret key for signing auth tokens                |
| `GEMINI_API_KEY` | No       | Google AI key (without it, uses basic local diff)  |

## API Endpoints

| Method | Path                 | Auth | Description                    |
|--------|----------------------|------|--------------------------------|
| POST   | /api/auth/signup     | No   | Create account                 |
| POST   | /api/auth/login      | No   | Login                          |
| GET    | /api/auth/me         | Yes  | Get current user               |
| POST   | /api/documents/upload| Yes  | Upload file (PDF/DOCX/TXT)    |
| POST   | /api/documents/paste | Yes  | Submit text directly           |
| GET    | /api/documents       | Yes  | List documents                 |
| POST   | /api/analyses/create | Yes  | Create comparison analysis     |
| GET    | /api/analyses        | Yes  | List analyses                  |
| GET    | /api/analyses/:id    | Yes  | Get analysis with clause diffs |
| GET    | /api/health          | No   | Health check                   |

See full API reference at `/documentation` when running the app, or open `src/pages/DocumentationPage.tsx`.

## License

MIT
