import { db } from '../db.js'
import { extractChangedSections } from '../services/differ.js'
import { analyzeClause, generateSummary } from '../services/ai.js'
import { validateDocIds, ValidationError } from '../services/validation.js'
import { logger } from '../services/logger.js'
import { json, parseBody, requireAuth, handleError } from '../helpers.js'

export async function handleCreateAnalysis(req) {
  try {
    const { userId } = await requireAuth(req)
    const body = await parseBody(req)
    const { docAId, docBId } = validateDocIds(body)

    const [docAResult, docBResult] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM documents WHERE id = ? AND user_id = ?', args: [docAId, userId] }),
      db.execute({ sql: 'SELECT * FROM documents WHERE id = ? AND user_id = ?', args: [docBId, userId] }),
    ])
    if (docAResult.rows.length === 0 || docBResult.rows.length === 0) {
      return json({ error: 'Document not found' }, 404)
    }
    const docA = docAResult.rows[0]
    const docB = docBResult.rows[0]

    const userResult = await db.execute({
      sql: 'SELECT ai_api_key, ai_provider FROM users WHERE id = ?',
      args: [userId],
    })
    const userRow = userResult.rows[0]
    const userKey = userRow?.ai_api_key
    const userProvider = userRow?.ai_provider || 'gemini'
    if (!userKey) {
      return json(
        { error: 'You must set your own API key (and choose a provider) in Settings before running an analysis.' },
        400
      )
    }
    const config = { provider: userProvider, key: userKey }

    const analysisId = crypto.randomUUID()
    await db.execute({
      sql: 'INSERT INTO analyses (id, user_id, doc_a_id, doc_b_id, status) VALUES (?, ?, ?, ?, ?)',
      args: [analysisId, userId, docAId, docBId, 'processing'],
    })

    processAnalysis(analysisId, docA.content, docB.content, config).catch((err) => {
      logger.error('Background analysis failed', { analysisId, error: err.message })
    })

    return json({ analysisId, status: 'processing' }, 202)
  } catch (err) {
    if (err instanceof ValidationError) return json({ error: err.message }, 400)
    return handleError(err)
  }
}

async function processAnalysis(analysisId, contentA, contentB, config) {
  try {
    const changedSections = extractChangedSections(contentA, contentB)
    if (changedSections.length === 0) {
      await db.execute({
        sql: 'UPDATE analyses SET status = ?, summary = ? WHERE id = ?',
        args: ['completed', 'No material differences were detected between these documents.', analysisId],
      })
      return
    }

    const clauseResults = []
    for (const section of changedSections) {
      const result = await analyzeClause(section.before, section.after, config)
      const clauseId = crypto.randomUUID()
      await db.execute({
        sql: 'INSERT INTO clause_diffs (id, analysis_id, clause_text_before, clause_text_after, plain_english_summary, favors, severity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          clauseId,
          analysisId,
          section.before,
          section.after,
          result.plain_english_summary,
          result.favors,
          result.severity,
        ],
      })
      clauseResults.push(result)
    }

    const summary = await generateSummary(clauseResults, config)
    await db.execute({
      sql: 'UPDATE analyses SET status = ?, summary = ? WHERE id = ?',
      args: ['completed', summary.summary, analysisId],
    })
    logger.info('Analysis completed', { analysisId, clauses: clauseResults.length })
  } catch (err) {
    logger.error('Analysis processing failed', { analysisId, error: err.message })
    await db.execute({ sql: 'UPDATE analyses SET status = ? WHERE id = ?', args: ['failed', analysisId] })
  }
}

export async function handleListAnalyses(req) {
  try {
    const { userId } = await requireAuth(req)
    const result = await db.execute({
      sql: `SELECT a.id, a.status, a.summary, a.created_at,
                   d1.original_name as doc_a_name, d2.original_name as doc_b_name
            FROM analyses a
            JOIN documents d1 ON a.doc_a_id = d1.id
            JOIN documents d2 ON a.doc_b_id = d2.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC`,
      args: [userId],
    })
    return json({ analyses: result.rows })
  } catch (err) {
    return handleError(err)
  }
}

export async function handleGetAnalysis(req, id) {
  try {
    const { userId } = await requireAuth(req)
    const result = await db.execute({
      sql: `SELECT a.*, d1.original_name as doc_a_name, d1.content as doc_a_content,
                   d2.original_name as doc_b_name, d2.content as doc_b_content
            FROM analyses a
            JOIN documents d1 ON a.doc_a_id = d1.id
            JOIN documents d2 ON a.doc_b_id = d2.id
            WHERE a.id = ? AND a.user_id = ?`,
      args: [id, userId],
    })
    if (result.rows.length === 0) return json({ error: 'Analysis not found' }, 404)
    const analysis = result.rows[0]
    const clauses = await db.execute({
      sql: 'SELECT * FROM clause_diffs WHERE analysis_id = ?',
      args: [id],
    })
    return json({
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
      clauses: clauses.rows,
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function handleDeleteAnalysis(req, id) {
  try {
    const { userId } = await requireAuth(req)
    const result = await db.execute({
      sql: 'SELECT id FROM analyses WHERE id = ? AND user_id = ?',
      args: [id, userId],
    })
    if (result.rows.length === 0) return json({ error: 'Analysis not found' }, 404)
    await db.execute({ sql: 'DELETE FROM clause_diffs WHERE analysis_id = ?', args: [id] })
    await db.execute({ sql: 'DELETE FROM analyses WHERE id = ?', args: [id] })
    return json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
