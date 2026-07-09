import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { extractChangedSections } from '../services/differ.js';
import { analyzeClause, generateSummary, type AIConfig, type Provider } from '../services/ai.js';
import { validateDocIds } from '../services/validation.js';
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
    const userKey = userRow?.ai_api_key;
    const userProvider: Provider = userRow?.ai_provider || 'gemini';
    if (!userKey) {
      res.status(400).json({ error: 'You must set your own API key (and choose a provider) in Settings before running an analysis.' });
      return;
    }
    const config: AIConfig = { provider: userProvider, key: userKey };

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

async function processAnalysis(analysisId: string, contentA: string, contentB: string, config: AIConfig) {
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

export default router;
