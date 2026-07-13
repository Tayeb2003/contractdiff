import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { extractChangedSections } from '../services/differ.js';
import { analyzeClause, generateSummary, type AIConfig, type Provider } from '../services/ai.js';
import { validateDocIds } from '../services/validation.js';
import { decryptApiKey } from '../services/crypto.js';
import { logger } from '../services/logger.js';

const router = Router();

router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { docAId, docBId } = validateDocIds(req.body);
    const userId = (req as AuthenticatedRequest).userId!;

    const docA = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(docAId, userId) as any;
    const docB = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(docBId, userId) as any;

    if (!docA || !docB) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const userRow = db.prepare('SELECT ai_api_key, ai_provider FROM users WHERE id = ?').get(userId) as any;
    const rawUserKey = decryptApiKey(userRow?.ai_api_key);
    const userProvider: Provider = userRow?.ai_provider || 'gemini';

    // Prefer the user's own key; otherwise fall back to a server-provided
    // default key (if configured) so the app can work out of the box. If no
    // key is available at all, run a local (AI-free) analysis instead of
    // blocking the request. This matches the edge/cf-worker behaviour.
    // SECURITY: only set DEFAULT_AI_KEY when you accept that all users' analyses
    // will bill against your provider quota with no per-user isolation — leave
    // it unset to require each user's own key.
    const defaultKey = process.env.DEFAULT_AI_KEY;
    const defaultProvider: Provider = (process.env.DEFAULT_AI_PROVIDER as Provider) || 'gemini';
    const key = rawUserKey || defaultKey;
    const provider = rawUserKey ? userProvider : defaultProvider;
    const config: AIConfig | null = key ? { provider, key } : null;
    if (!config) {
      logger.warn('No API key available for analysis; will use local fallback.', { userId });
    }

    const analysisId = uuidv4();
    db.prepare(
      'INSERT INTO analyses (id, user_id, doc_a_id, doc_b_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(analysisId, userId, docAId, docBId, 'processing');

    res.status(202).json({ analysisId, status: 'processing' });

    processAnalysis(analysisId, docA.content, docB.content, config).catch((err) => {
      logger.error('Background analysis failed', { analysisId, error: err.message });
    });
  } catch (err: any) {
    if (res.headersSent) {
      logger.error('Analysis creation failed after response sent', { error: err.message });
      return;
    }
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('Analysis creation failed', { error: err.message });
    res.status(500).json({ error: err.message || 'Analysis creation failed' });
  }
});

async function processAnalysis(analysisId: string, contentA: string, contentB: string, config: AIConfig | null) {
  try {
    const changedSections = extractChangedSections(contentA, contentB);

    if (changedSections.length === 0) {
      db.prepare('UPDATE analyses SET status = ?, summary = ? WHERE id = ?').run(
        'completed',
        'No material differences were detected between these documents.',
        analysisId
      );
      return;
    }

    const clauseResults = [];
    for (const section of changedSections) {
      const result = await analyzeClause(section.before, section.after, config);
      const clauseId = uuidv4();
      db.prepare(
        `INSERT INTO clause_diffs (id, analysis_id, clause_text_before, clause_text_after, plain_english_summary, favors, severity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        clauseId,
        analysisId,
        section.before,
        section.after,
        result.plain_english_summary,
        result.favors,
        result.severity
      );
      clauseResults.push(result);
    }

    const summary = await generateSummary(clauseResults, config);
    db.prepare('UPDATE analyses SET status = ?, summary = ? WHERE id = ?').run(
      'completed',
      summary.summary,
      analysisId
    );

    logger.info('Analysis completed', { analysisId, clauses: clauseResults.length });
  } catch (err: any) {
    logger.error('Analysis processing failed', { analysisId, error: err.message });
    db.prepare('UPDATE analyses SET status = ? WHERE id = ?').run('failed', analysisId);
  }
}

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const analyses = db.prepare(`
    SELECT a.id, a.status, a.summary, a.created_at,
           d1.original_name as doc_a_name, d2.original_name as doc_b_name
    FROM analyses a
    JOIN documents d1 ON a.doc_a_id = d1.id
    JOIN documents d2 ON a.doc_b_id = d2.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `).all(userId);
  res.json({ analyses });
});

router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const analysis = db.prepare(`
    SELECT a.*, d1.original_name as doc_a_name, d1.content as doc_a_content,
           d2.original_name as doc_b_name, d2.content as doc_b_content
    FROM analyses a
    JOIN documents d1 ON a.doc_a_id = d1.id
    JOIN documents d2 ON a.doc_b_id = d2.id
    WHERE a.id = ? AND a.user_id = ?
  `).get(req.params.id, userId) as any;

  if (!analysis) {
    res.status(404).json({ error: 'Analysis not found' });
    return;
  }

  const clauses = db.prepare('SELECT * FROM clause_diffs WHERE analysis_id = ?').all(analysis.id);

  res.json({
    analysis: {
      id: analysis.id,
      status: analysis.status,
      summary: analysis.summary,
      createdAt: analysis.created_at,
      docAName: analysis.doc_a_name,
      docBName: analysis.doc_b_name,
      docAContent: analysis.doc_a_content,
      docBContent: analysis.doc_b_content,
    },
    clauses,
  });
});

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const analysis = db.prepare('SELECT id FROM analyses WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!analysis) {
      res.status(404).json({ error: 'Analysis not found' });
      return;
    }
    db.prepare('DELETE FROM clause_diffs WHERE analysis_id = ?').run(req.params.id);
    db.prepare('DELETE FROM analyses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Delete failed' });
  }
});

/**
 * Re-run any analyses left in `processing` (e.g. the server was restarted
 * while a background analysis was in flight). Existing partial clause diffs
 * are cleared first so re-processing is idempotent.
 */
export function recoverAnalyses(): void {
  try {
    const stuck = db
      .prepare("SELECT id, doc_a_id, doc_b_id, user_id FROM analyses WHERE status = 'processing'")
      .all() as any[];
    if (stuck.length === 0) return;
    logger.info('Recovering in-flight analyses', { count: stuck.length });
    for (const a of stuck) {
      const docA = db.prepare('SELECT content FROM documents WHERE id = ? AND user_id = ?').get(a.doc_a_id, a.user_id) as any;
      const docB = db.prepare('SELECT content FROM documents WHERE id = ? AND user_id = ?').get(a.doc_b_id, a.user_id) as any;
      if (!docA || !docB) {
        db.prepare("UPDATE analyses SET status = 'failed' WHERE id = ?").run(a.id);
        continue;
      }
      db.prepare('DELETE FROM clause_diffs WHERE analysis_id = ?').run(a.id);
      db.prepare("UPDATE analyses SET status = 'processing', summary = NULL WHERE id = ?").run(a.id);

      const userRow = db.prepare('SELECT ai_api_key, ai_provider FROM users WHERE id = ?').get(a.user_id) as any;
      const rawUserKey = decryptApiKey(userRow?.ai_api_key);
      const userProvider: Provider = userRow?.ai_provider || 'gemini';
      const defaultKey = process.env.DEFAULT_AI_KEY;
      const defaultProvider: Provider = (process.env.DEFAULT_AI_PROVIDER as Provider) || 'gemini';
      const key = rawUserKey || defaultKey;
      const provider = rawUserKey ? userProvider : defaultProvider;
      const config: AIConfig | null = key ? { provider, key } : null;
      processAnalysis(a.id, docA.content, docB.content, config).catch((err) =>
        logger.error('Recovery analysis failed', { analysisId: a.id, error: err.message })
      );
    }
  } catch (err: any) {
    logger.error('Analysis recovery scan failed', { error: err.message });
  }
}

export default router;
