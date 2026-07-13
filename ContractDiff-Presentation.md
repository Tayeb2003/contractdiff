---
marp: true
paginate: true
header: 'ContractDiff'
footer: 'AI-powered contract comparison for non-lawyers'
theme: default
style: |
  section {
    background: #0a2e28;
    color: #dce6e0;
    font-family: Inter, "Segoe UI", system-ui, sans-serif;
    font-size: 26px;
    padding: 60px 70px;
  }
  h1, h2, h3 {
    color: #94e8b4;
    font-family: "Playfair Display", Georgia, serif;
    margin-bottom: 0.3em;
  }
  h1 { font-size: 56px; }
  h2 { font-size: 42px; }
  strong { color: #94e8b4; }
  a { color: #94e8b4; }
  code {
    background: #06231e;
    color: #94e8b4;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85em;
  }
  pre {
    background: #06231e;
    border: 1px solid #1c5247;
    border-radius: 8px;
    font-size: 18px;
    line-height: 1.25;
  }
  pre code { background: transparent; padding: 0; color: #dce6e0; }
  table { border-collapse: collapse; width: 100%; font-size: 22px; }
  th, td { border: 1px solid #1c5247; padding: 8px 12px; text-align: left; }
  th { background: #06231e; color: #94e8b4; }
  blockquote {
    border-left: 4px solid #94e8b4;
    margin: 0.5em 0;
    padding: 0.2em 1em;
    color: #b9c9c2;
  }
  section::after {
    color: #5e8c7d;
    font-size: 16px;
  }
---

<!-- _class: lead -->
<!-- _paginate: false -->

# ContractDiff

### AI-powered contract comparison for non-lawyers

<br>

**Your Name** · Course Name · Date

<!--
Presenter note: Open with energy. "Today I'll show you ContractDiff — a full-stack web app that reads two versions of a contract and tells you, in plain English, what actually changed." Keep this slide ~20 seconds.
-->

---

## The Problem

- Legal contracts change between versions with **no clear signal** of what's different.
- Redlining is **manual, slow, and needs a lawyer**.
- Non-lawyers are left **guessing about risk**.

> A one-page amendment can hide a clause that shifts millions in liability. The problem isn't reading — it's *comparing*.

<!--
Say this: "A one-page amendment can hide a clause that shifts millions in liability. The problem isn't reading — it's comparing." Pause for effect.
-->

---

## What ContractDiff Does

1. **Upload** PDF / DOCX / TXT *or* paste text — two versions (Original vs Revised).
2. **Automatic** clause-by-clause diff.
3. **Plain-English explanations**, with:
   - **Severity** ratings (minor / moderate / major)
   - **"Who it favors"** analysis (Party A / Party B / Neutral / Ambiguous)
   - An **executive summary**

<!--
Demo hook: "You give it the old and new version. It extracts the text, finds the changes, and explains each one in language a normal person understands."
-->

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | **React 19**, TypeScript, Vite, Tailwind v4, React Router, Framer Motion |
| Backend (prod) | **Cloudflare Workers** (serverless JS) |
| Database | **Turso** — libSQL, serverless SQLite |
| AI | Gemini / OpenAI / Anthropic / NVIDIA + **local fallback** |
| Auth | Custom JWT (HS256, Web Crypto) + PBKDF2 |
| Diff | `diff-match-patch` |

<!--
Note: the repo has three backend variants — an Express local dev server, a Wasmer WinterJS attempt we dropped, and the Cloudflare Worker we actually shipped. Good "real engineering" point.
-->

---

## System Architecture

```text
   Browser ──► React SPA (Wasmer static)
                │  HTTPS + JWT (Bearer)
                ▼
          Cloudflare Worker (API)
          ├── Turso (libSQL)      ├── AI Providers
          └── local diff fallback
```

- Frontend: global **static CDN** (Wasmer Edge)
- Backend: **serverless** at the edge (~300 locations)
- Data: **edge-replicated** serverless database

<!--
Say this: "The browser talks to a Cloudflare Worker over HTTPS with a JWT. The worker reads and writes Turso, calls AI providers, and has a built-in fallback if AI is unavailable."
-->

---

## How an Analysis Works

```text
User      SPA          Worker      Turso      AI
 │  upload A/B │          │          │          │
 │────────────►│ parse    │          │          │
 │             │(client)  │          │          │
 │  paste text ►│────────►│ store    │          │
 │             │          │─────────►│          │
 │  create     │────────►│ diff     │          │
 │  analysis   │  202     │─────────►│          │
 │◄────────────│ processing          │          │
 │  poll ──────►│ get analysis       │          │
 │             │          │ per change ────────►│
 │             │          │◄─────────│ summary  │
 │◄─ results ──│          │          │          │
```

<!--
Key point: text is extracted in the browser, the API returns 202 immediately, and the client polls until the report is ready — no blocked requests.
-->

---

## Key Engineering Decisions

- **Client-side parsing** → privacy + less server load (raw files never uploaded).
- **Async background analysis** → instant `202`, client polls for results.
- **Multi-provider AI + local fallback** → works even with **no API key**.
- **Turso over a traditional DB** → serverless, no connection pooling.

> Every choice favors resilience and scale — including a fallback analyzer so the app never breaks when an AI key is missing.

<!--
Emphasize the fallback: "If the LLM fails or there's no key, a built-in rule-based analyzer still produces a useful result."
-->

---

## Real Bugs We Shipped & Fixed

1. **Hard-refresh blank page** → SPA used path routes; static host 404'd. Fix: `HashRouter`.
2. **Startup crash from `mammoth`** → a Node library was bundled into the main chunk. Fix: dynamic `import()`.
3. **"Missing icons" panic** → actually MetaMask extension console noise, *not* our app.

<!--
Great story: "Deploying to real infrastructure surfaced three bugs. Fixing them taught me to separate real signal from noise and to design for static hosting."
-->

---

## Deployment & Scale

- **Frontend:** Wasmer Edge — static, global CDN.
- **Backend:** Cloudflare Workers — runs at the edge, auto-scales.
- **Database:** Turso — replicated, serverless.
- **Result:** low-latency, auto-scaling, **zero servers to manage**.

<!--
Say this: "There are no virtual machines to patch. The whole thing runs on two edge platforms and scales to zero when idle."
-->

---

<!-- _class: lead -->
<!-- _paginate: false -->

# Demo & Conclusion

**Live walkthrough:** upload two docs → watch the analysis → review clause cards.

> Practical AI. Real full-stack engineering. Deployed to production.

<br>

**Thank you — questions?**

<!--
Closing: "Let me show you it live — and that's ContractDiff: a complete, production-deployed full-stack application built to solve a real problem." Then run the live demo from contractdiff.wasmer.app.
-->
