import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { parseDocument } from '../services/parser.js';
import { validate, ValidationError } from '../services/validation.js';
import { logger } from '../services/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
    }
  },
});

const router = Router();

// Strip path separators and control chars from user-supplied names before
// storing/reflecting them. The upload filename on disk is always a UUID, but
// `original_name`/`title` are echoed back to clients and must not carry
// path-traversal or injection payloads.
function sanitizeName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\0/\\]/g, '').trim().slice(0, 500);
}

router.post('/upload', authMiddleware, async (req: Request, res: Response) => {
  try {
    upload.single('file')(req, res, async (uploadErr) => {
      if (uploadErr) {
        res.status(400).json({ error: uploadErr.message });
        return;
      }
      try {
        const file = req.file;
        if (!file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }
        const userId = (req as AuthenticatedRequest).userId!;
        let content: string;
        try {
          content = await parseDocument(file.path, file.mimetype);
        } catch (parseErr: any) {
          // Clean up the already-written upload so failed parses don't leak files.
          await fsp.unlink(file.path).catch(() => {});
          logger.error('Document upload/parse failed', { error: parseErr.message });
          res.status(500).json({ error: parseErr.message || 'Upload failed' });
          return;
        }
        const id = uuidv4();
        db.prepare(
          'INSERT INTO documents (id, user_id, filename, original_name, content, doc_type) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, userId, file.filename, sanitizeName(file.originalname), content, file.mimetype);
        res.status(201).json({
          id,
          originalName: sanitizeName(file.originalname),
          docType: file.mimetype,
          contentLength: content.length,
        });
      } catch (parseErr: any) {
        logger.error('Document upload/parse failed', { error: parseErr.message });
        res.status(500).json({ error: parseErr.message || 'Upload failed' });
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

router.post('/paste', authMiddleware, (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    validate(req.body, {
      content: { required: true, message: 'Content is required' },
      title: { max: 500 },
    });

    const userId = (req as AuthenticatedRequest).userId!;
    const id = uuidv4();
    const safeTitle = sanitizeName(title) || 'pasted-text';
    db.prepare(
      'INSERT INTO documents (id, user_id, filename, original_name, content, doc_type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, userId, `${id}.txt`, safeTitle, content, 'text/plain');
    res.status(201).json({
      id,
      originalName: safeTitle,
      docType: 'text/plain',
      contentLength: content.length,
    });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const docs = db.prepare(
    'SELECT id, original_name, doc_type, upload_date FROM documents WHERE user_id = ? ORDER BY upload_date DESC'
  ).all(userId);
  res.json({ documents: docs });
});

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId!;
    const doc = db.prepare('SELECT id FROM documents WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    // Cascade: remove analyses that reference this document
    const linked = db
      .prepare('SELECT id FROM analyses WHERE user_id = ? AND (doc_a_id = ? OR doc_b_id = ?)')
      .all(userId, req.params.id, req.params.id) as any[];
    const delClauses = db.prepare('DELETE FROM clause_diffs WHERE analysis_id = ?');
    const delAnalysis = db.prepare('DELETE FROM analyses WHERE id = ?');
    // Fetch the stored filename BEFORE deleting the row so we can remove the
    // on-disk upload (otherwise the file is orphaned forever).
    const docFile = db.prepare('SELECT filename FROM documents WHERE id = ?').get(req.params.id) as any;
    const delDoc = db.prepare('DELETE FROM documents WHERE id = ?');
    const tx = db.transaction(() => {
      for (const a of linked) {
        delClauses.run(a.id);
        delAnalysis.run(a.id);
      }
      delDoc.run(req.params.id);
    });
    tx();
    if (docFile?.filename) {
      fsp.unlink(path.join(uploadsDir, docFile.filename)).catch(() => {});
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Delete failed' });
  }
});

export default router;
