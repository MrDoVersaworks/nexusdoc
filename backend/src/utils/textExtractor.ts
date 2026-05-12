import pdf from 'pdf-parse';
import { ACCEPTED_MIME_TYPES } from '../constants';
import { ErrorCode } from '../constants';

export async function extractText(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'text/plain') {
    const text = fileBuffer.toString('utf-8');
    if (text.trim().length === 0) {
      throw new Error(`[${ErrorCode.DOC_TEXT_EXTRACTION_FAILED}] File is empty`);
    }
    return text;
  }

  if (mimeType === 'application/pdf') {
    const pdfData = await pdf(fileBuffer);
    const text = pdfData.text;
    if (text.trim().length === 0) {
      throw new Error(`[${ErrorCode.DOC_TEXT_EXTRACTION_FAILED}] PDF contains no extractable text`);
    }
    return text;
  }

  const acceptedTypes = ACCEPTED_MIME_TYPES.join(', ');
  throw new Error(
    `[${ErrorCode.DOC_INVALID_TYPE}] Unsupported file type: ${mimeType}. Accepted types: ${acceptedTypes}`
  );
}
