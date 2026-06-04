import { extractText, getDocumentProxy } from 'unpdf';

/**
 * Extract plain text from a PDF buffer. Uses unpdf (serverless-safe PDF.js build)
 * so extraction works on Vercel — pdf-parse v2 often fails in bundled serverless runtimes.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join('\n') : text;
  return merged.replace(/\s+/g, ' ').trim();
}
