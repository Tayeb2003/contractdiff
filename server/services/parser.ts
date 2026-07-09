import mammoth from 'mammoth';
import fs from 'fs/promises';

async function parsePDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    await parser.destroy().catch(() => {});
  }
}

export async function parseDocument(filePath: string, mimetype: string): Promise<string> {
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch {
    throw new Error(`Failed to read file at ${filePath}`);
  }

  try {
    if (mimetype === 'application/pdf') {
      return await parsePDF(buffer);
    }

    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type: ${mimetype}`);
  } catch (err: unknown) {
    if (err instanceof Error) throw err;
    throw new Error('Document parsing failed');
  }
}
