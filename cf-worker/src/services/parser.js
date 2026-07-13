import mammoth from 'mammoth'

async function parsePDF(buffer) {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return result.text || ''
  } finally {
    await parser.destroy().catch(() => {})
  }
}

export async function parseDocument(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    return parsePDF(buffer)
  }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  if (mimetype === 'text/plain') {
    return new TextDecoder().decode(buffer)
  }
  throw new Error(`Unsupported file type: ${mimetype}`)
}
