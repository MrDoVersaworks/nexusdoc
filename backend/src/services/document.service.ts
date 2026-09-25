import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { put, del, get } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { db } from '../db/connection';
import { documents, documentChunks, storageCleanupTasks } from '../db/schema';
import { config } from '../config';
import { ErrorCode, MAX_FILE_SIZE_BYTES, ACCEPTED_MIME_TYPES, ACCEPTED_EXTENSIONS } from '../constants';
import { extractText } from '../utils/textExtractor';
import { chunkText } from '../utils/chunker';
import { summarizeText, generateEmbeddings } from './ai.service';
import { getDecryptedApiKey, getUserModels } from './settings.service';
import { logger } from '../utils/logger';
import type { DocumentListItem, DocumentDetail, PaginationMeta } from '../types';

interface UploadDocumentInput { userId: string; title: string; file: Express.Multer.File; }
interface ListDocumentsInput { userId: string; page: number; limit: number; sort: string; order: string; }
interface ListDocumentsResult { documents: DocumentListItem[]; pagination: PaginationMeta; }

function baseName(name: string): string {
  const normalized = name.replace(/\\/g, '/');
  return normalized.substring(normalized.lastIndexOf('/') + 1);
}

function validateFileContent(file: Express.Multer.File): void {
  const extension = `.${baseName(file.originalname).split('.').pop()?.toLowerCase() ?? ''}`;
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new Error(`[${ErrorCode.DOC_INVALID_TYPE}] Unsupported file extension.`);
  }
  if (!ACCEPTED_MIME_TYPES.includes(file.mimetype as typeof ACCEPTED_MIME_TYPES[number])) {
    throw new Error(`[${ErrorCode.DOC_INVALID_TYPE}] Invalid file type metadata.`);
  }
  if (file.mimetype === 'application/pdf') {
    if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new Error(`[${ErrorCode.DOC_INVALID_TYPE}] File content does not match PDF format.`);
    }
    return;
  }
  if (file.buffer.includes(0)) {
    throw new Error(`[${ErrorCode.DOC_INVALID_TYPE}] Text upload contains binary data.`);
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(file.buffer);
  } catch {
    throw new Error(`[${ErrorCode.DOC_INVALID_TYPE}] Text upload is not valid UTF-8.`);
  }
}

function toListItem(doc: typeof documents.$inferSelect): DocumentListItem {
  return {
    id: doc.id,
    title: doc.title,
    original_filename: doc.original_filename,
    file_type: doc.file_type,
    file_size_bytes: doc.file_size_bytes,
    ai_summary: doc.ai_summary,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
    download_path: `/api/documents/${doc.id}/download`,
  };
}

function toDetail(doc: typeof documents.$inferSelect): DocumentDetail {
  return { ...toListItem(doc), user_id: doc.user_id, content_text: doc.content_text };
}

async function recordCleanupFailure(blobUrl: string, userId: string, reason: string, error: unknown): Promise<void> {
  try {
    await db.insert(storageCleanupTasks).values({
      blob_url: blobUrl,
      user_id: userId,
      reason,
      attempts: 0,
      last_error: error instanceof Error ? error.message : String(error),
    });
  } catch (recordError) {
    logger.error('DOCUMENT', 'Failed to persist storage cleanup task', recordError);
  }
}

export async function uploadDocument(input: UploadDocumentInput): Promise<DocumentDetail> {
  const { userId, title, file } = input;
  if (file.size > MAX_FILE_SIZE_BYTES) throw new Error(`[${ErrorCode.DOC_TOO_LARGE}] File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
  validateFileContent(file);
  if (!config.BLOB_READ_WRITE_TOKEN) throw new Error(`[${ErrorCode.DOC_UPLOAD_FAILED}] File storage is not configured.`);

  const safeFilename = baseName(file.originalname);
  const blob = await put(`documents/${userId}/${randomUUID()}-${safeFilename}`, file.buffer, {
    access: 'private',
    addRandomSuffix: true,
    contentType: file.mimetype,
    token: config.BLOB_READ_WRITE_TOKEN,
  });

  try {
    const contentText = await extractText(file.buffer, file.mimetype);
    const apiKey = await getDecryptedApiKey(userId);
    const models = await getUserModels(userId);
    const aiSummary = await summarizeText(apiKey, models.geminiModel, contentText);
    const chunks = chunkText(contentText);
    const embeddings = chunks.length > 0
      ? await generateEmbeddings(apiKey, models.geminiEmbeddingModel, chunks.map((c) => c.text))
      : [];

    const documentId = randomUUID();
    const documentValues = {
      id: documentId,
      user_id: userId,
      title,
      original_filename: safeFilename,
      file_url: blob.url,
      file_type: file.mimetype,
      file_size_bytes: file.size,
      content_text: contentText,
      ai_summary: aiSummary,
    };

    if (chunks.length > 0) {
      const chunkValues = chunks.map((chunk, i) => ({
        document_id: documentId,
        user_id: userId,
        chunk_text: chunk.text,
        embedding: embeddings[i],
        chunk_index: chunk.index,
      }));
      const batch = await db.batch([
        db.insert(documents).values(documentValues).returning(),
        db.insert(documentChunks).values(chunkValues),
      ]);
      const inserted = batch[0];
      if (!Array.isArray(inserted) || inserted.length !== 1) throw new Error('Document insert did not return one row.');
      logger.info('DOCUMENT', `Document uploaded: ${documentId} for user: ${userId}. ${chunks.length} chunks embedded.`);
      return toDetail(inserted[0]);
    }

    const [inserted] = await db.insert(documents).values(documentValues).returning();
    if (!inserted) throw new Error('Document insert did not return a row.');
    return toDetail(inserted);
  } catch (error: unknown) {
    try {
      await del(blob.url, { access: 'private', token: config.BLOB_READ_WRITE_TOKEN });
    } catch (cleanupError) {
      await recordCleanupFailure(blob.url, userId, 'upload-compensation', cleanupError);
    }
    throw error;
  }
}

export async function listDocuments(input: ListDocumentsInput): Promise<ListDocumentsResult> {
  const { userId, page, limit, sort, order } = input;
  const offset = (page - 1) * limit;
  const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(documents).where(eq(documents.user_id, userId));
  const total = countResult[0]?.count ?? 0;
  const sortColumn = sort === 'title' ? documents.title : sort === 'updated_at' ? documents.updated_at : documents.created_at;
  const orderFn = order === 'asc' ? asc : desc;
  const docs = await db.select().from(documents).where(eq(documents.user_id, userId)).orderBy(orderFn(sortColumn)).limit(limit).offset(offset);
  return {
    documents: docs.map(toListItem),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDocument(userId: string, documentId: string): Promise<DocumentDetail> {
  const docs = await db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.user_id, userId))).limit(1);
  if (docs.length === 0) throw new Error(`[${ErrorCode.DOC_NOT_FOUND}] Document not found.`);
  return toDetail(docs[0]);
}

export async function downloadDocument(userId: string, documentId: string, res: Response): Promise<void> {
  const docs = await db.select({
    id: documents.id, file_url: documents.file_url, original_filename: documents.original_filename, file_type: documents.file_type,
  }).from(documents).where(and(eq(documents.id, documentId), eq(documents.user_id, userId))).limit(1);
  if (docs.length === 0) throw new Error(`[${ErrorCode.DOC_NOT_FOUND}] Document not found.`);
  if (!config.BLOB_READ_WRITE_TOKEN) throw new Error(`[${ErrorCode.DOC_UPLOAD_FAILED}] File storage is not configured.`);

  const result = await get(docs[0].file_url, { access: 'private', token: config.BLOB_READ_WRITE_TOKEN });
  if (!result || result.statusCode !== 200 || !result.stream) throw new Error(`[${ErrorCode.DOC_NOT_FOUND}] Stored document could not be retrieved.`);

  res.status(200);
  res.setHeader('Content-Type', docs[0].file_type);
  res.setHeader('Content-Disposition', `attachment; filename="${docs[0].original_filename.replace(/["\\\r\n]/g, '_')}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  const { Readable } = await import('node:stream');
  Readable.fromWeb(result.stream as globalThis.ReadableStream<Uint8Array>).pipe(res);
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  const docs = await db.select({ id: documents.id, file_url: documents.file_url })
    .from(documents).where(and(eq(documents.id, documentId), eq(documents.user_id, userId))).limit(1);
  if (docs.length === 0) throw new Error(`[${ErrorCode.DOC_NOT_FOUND}] Document not found.`);
  if (!config.BLOB_READ_WRITE_TOKEN) throw new Error(`[${ErrorCode.DOC_UPLOAD_FAILED}] File storage is not configured.`);

  try {
    await del(docs[0].file_url, { access: 'private', token: config.BLOB_READ_WRITE_TOKEN });
  } catch (error: unknown) {
    await recordCleanupFailure(docs[0].file_url, userId, 'document-delete', error);
    throw new Error(`[${ErrorCode.INTERNAL_ERROR}] Document storage cleanup failed; the document was retained. Please retry.`);
  }

  await db.delete(documents).where(and(eq(documents.id, documentId), eq(documents.user_id, userId)));
  logger.info('DOCUMENT', `Document deleted: ${documentId} for user: ${userId}`);
}
