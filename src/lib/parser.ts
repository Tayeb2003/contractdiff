export async function parseFileClient(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return parsePDFClient(file);
  }
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    return parseDocxClient(file);
  }
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return file.text();
  }
  throw new Error(`Unsupported file type: ${file.type || file.name}`);
}

async function parsePDFClient(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs: any = await import('pdfjs-dist');
  try {
    const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = (workerModule as any).default;
  } catch {
    try {
      const workerModule = await import('pdfjs-dist/build/pdf.worker.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = (workerModule as any).default;
    } catch {
      /* fall back to main thread */
    }
  }
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    text += pageText + '\n';
  }
  return text.trim();
}

async function parseDocxClient(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const mammoth: any = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
