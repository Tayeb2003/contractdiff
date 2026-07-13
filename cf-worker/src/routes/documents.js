import { db } from '../db.js'
import { parseDocument } from '../services/parser.js'
import { validate, ValidationError } from '../services/validation.js'
import { json, parseBody, requireAuth, handleError } from '../helpers.js'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

function sanitizeName(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/[\0/\\]/g, '').trim().slice(0, 500)
}

export async function handleUpload(req) {
  try {
    const { userId } = await requireAuth(req)
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file) return json({ error: 'No file uploaded' }, 400)

    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    if (!allowed.includes(file.type)) {
      return json({ error: 'Only PDF, DOCX, and TXT files are allowed' }, 400)
    }
    // Bounded upload size — without this a worker can be exhausted by a huge
    // multipart body (M4).
    if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
      return json({ error: 'File too large (maximum 20MB)' }, 413)
    }

    const buffer = await file.arrayBuffer()
    const content = await parseDocument(buffer, file.type)
    const id = crypto.randomUUID()
    const ext = sanitizeName(file.name).split('.').pop() || 'bin'
    const originalName = sanitizeName(file.name) || 'uploaded-file'

    await db.execute({
      sql: 'INSERT INTO documents (id, user_id, filename, original_name, content, doc_type) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, userId, `${id}.${ext}`, originalName, content, file.type],
    })
    return json({ id, originalName, docType: file.type, contentLength: content.length }, 201)
  } catch (err) {
    return handleError(err)
  }
}

export async function handlePaste(req) {
  try {
    const { userId } = await requireAuth(req)
    const body = await parseBody(req)
    validate(body, {
      content: { required: true, message: 'Content is required' },
      title: { max: 500 },
    })
    const id = crypto.randomUUID()
    const safeTitle = sanitizeName(body.title) || 'pasted-text'
    await db.execute({
      sql: 'INSERT INTO documents (id, user_id, filename, original_name, content, doc_type) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, userId, `${id}.txt`, safeTitle, body.content, 'text/plain'],
    })
    return json(
      { id, originalName: safeTitle, docType: 'text/plain', contentLength: body.content.length },
      201
    )
  } catch (err) {
    if (err instanceof ValidationError) return json({ error: err.message }, 400)
    return handleError(err)
  }
}

export async function handleListDocs(req) {
  try {
    const { userId } = await requireAuth(req)
    const result = await db.execute({
      sql: 'SELECT id, original_name, doc_type, upload_date FROM documents WHERE user_id = ? ORDER BY upload_date DESC',
      args: [userId],
    })
    return json({ documents: result.rows })
  } catch (err) {
    return handleError(err)
  }
}

export async function handleDeleteDoc(req, id) {
  try {
    const { userId } = await requireAuth(req)
    const doc = await db.execute({
      sql: 'SELECT id FROM documents WHERE id = ? AND user_id = ?',
      args: [id, userId],
    })
    if (doc.rows.length === 0) return json({ error: 'Document not found' }, 404)

    const linked = await db.execute({
      sql: 'SELECT id FROM analyses WHERE user_id = ? AND (doc_a_id = ? OR doc_b_id = ?)',
      args: [userId, id, id],
    })
    for (const a of linked.rows) {
      await db.execute({ sql: 'DELETE FROM clause_diffs WHERE analysis_id = ?', args: [a.id] })
      await db.execute({ sql: 'DELETE FROM analyses WHERE id = ?', args: [a.id] })
    }
    await db.execute({ sql: 'DELETE FROM documents WHERE id = ?', args: [id] })
    return json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
