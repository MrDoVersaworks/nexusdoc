import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { put, del } from '@vercel/blob';
import { db } from '../db/connection';
import { documents, documentChunks } from '../db/schema';
import { config } from '../config';
import { ErrorCode, MAX_FILE_SIZE_BYTES, ACCEPTED_MIME_TYPES } from '../constants';
import { extractText } from '../utils/textExtractor';
import { chunkText } from '../utils/chunker';
import { summarizeText, generateEmbeddings } from './ai.service';
import { getDecryptedApiKey, getUserModels } from './settings.service';
import { logger } from '../utils/logger';
import type { DocumentResponse, PaginationMeta } from '../types';

interface UploadDocumentInput {
  userId: string;
  title: string;
  file: Express.Multer.File;
}

interface ListDocumentsInput {
  userId: string;
  page: number;
  limit: number;
  sort: string;
  order: string;
}

interface ListDocumentsResult {
  documents: DocumentResponse[];
  pagination: PaginationMeta;
}

function toDocumentResponse(doc: typeof documents.$inferSelect): DocumentResponse {
  return {
    id: doc.id,
    user_id: doc.user_id,
    title: doc.title,
    original_filename: doc.original_filename,
    file_url: doc.file_url,
    file_type: doc.file_type,
    file_size_bytes: doc.file_size_bytes,
    content_text: doc.content_text,
    ai_summary: doc.ai_summary,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

export async function uploadDocument(input: UploadDocumentInput): Promise<DocumentResponse> {
  const { userId, title, file } = input;

  // Validate file type
  if (!ACCEPTED_MIME_TYPES.includes(file.mimetype as typeof ACCEPTED_MIME_TYPES[number])) {
    throw new Error(`[${ErrorCode.DOC_INVALID_TYPE}] Invalid file type: ${file.mimetype}. Accepted: ${ACCEPTED_MIME_TYPES.join(', ')}`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`[${ErrorCode.DOC_TOO_LARGE}] File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
  }

  // Validate blob storage token before upload
  if (!config.BLOB_READ_WRITE_TOKEN) {
    throw new Error(`[${ErrorCode.DOC_UPLOAD_FAILED}] File storage is not configured. Set BLOB_READ_WRITE_TOKEN in your environment.`);
  }

  // Upload to Vercel Blob
  const blob = await put(`documents/${userId}/${Date.now()}-${file.originalname}`, file.buffer, {
    access: 'public',
    token: config.BLOB_READ_WRITE_TOKEN,
  });

  // Extract text
  const contentText = await extractText(file.buffer, file.mimetype);

  const apiKey = await getDecryptedApiKey(userId);
  const models = await getUserModels(userId);

  // Summarize
  const aiSummary = await summarizeText(apiKey, models.geminiModel, contentText);

  // Chunk and embed
  const chunks = chunkText(contentText);
  let embeddings: number[][] = [];
  if (chunks.length > 0) {
    embeddings = await generateEmbeddings(
      apiKey,
      models.geminiEmbeddingModel,
      chunks.map((c) => c.text)
    );
  }

  // Insert document first
  const inserted = await db
    .insert(documents)
    .values({
      user_id: userId,
      title,
      original_filename: file.originalname,
      file_url: blob.url,
      file_type: file.mimetype,
      file_size_bytes: file.size,
      content_text: contentText,
      ai_summary: aiSummary,
    })
    .returning();

  if (inserted.length === 0) {
    throw new Error(`[${ErrorCode.DOC_UPLOAD_FAILED}] Failed to save document to database.`);
  }

  const document = inserted[0];

  // Insert chunks with embeddings via ORM (manual atomic emulation)
  try {
    if (chunks.length > 0 && embeddings.length === chunks.length) {
      const chunkValues = chunks.map((chunk, i) => ({
        document_id: document.id,
        user_id: userId,
        chunk_text: chunk.text,
        embedding: embeddings[i],
        chunk_index: chunk.index,
      }));

      await db.insert(documentChunks).values(chunkValues);
    }
  } catch (dbError: unknown) {
    // Rollback document if chunks fail (Determinism / C12)
    logger.error('DOCUMENT', 'Failed to insert chunks, rolling back document creation', dbError);
    await db.delete(documents).where(eq(documents.id, document.id));
    throw new Error(`[${ErrorCode.DOC_UPLOAD_FAILED}] Failed to save document analysis to database.`);
  }

  const result = document;

  logger.info('DOCUMENT', `Document uploaded: ${result.id} for user: ${userId}. ${chunks.length} chunks embedded.`);

  return toDocumentResponse(result);
}

export async function listDocuments(input: ListDocumentsInput): Promise<ListDocumentsResult> {
  const { userId, page, limit, sort, order } = input;
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents)
    .where(eq(documents.user_id, userId));

  if (countResult.length === 0) {
    throw new Error(`[${ErrorCode.INTERNAL_ERROR}] Failed to retrieve document count.`);
  }

  const total = countResult[0].count;

  // Get paginated documents
  const sortColumn = sort === 'title' ? documents.title :
                     sort === 'updated_at' ? documents.updated_at :
                     documents.created_at;

  const orderFn = order === 'asc' ? asc : desc;

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.user_id, userId))
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  return {
    documents: docs.map(toDocumentResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDocument(userId: string, documentId: string): Promise<DocumentResponse> {
  const docs = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.user_id, userId)))
    .limit(1);

  if (docs.length === 0) {
    throw new Error(`[${ErrorCode.DOC_NOT_FOUND}] Document not found.`);
  }

  return toDocumentResponse(docs[0]);
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  // Verify ownership and get file URL for blob cleanup
  const docs = await db
    .select({ id: documents.id, file_url: documents.file_url })
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.user_id, userId)))
    .limit(1);

  if (docs.length === 0) {
    throw new Error(`[${ErrorCode.DOC_NOT_FOUND}] Document not found.`);
  }

  // Delete from Vercel Blob
  if (config.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(docs[0].file_url, { token: config.BLOB_READ_WRITE_TOKEN });
    } catch (error: unknown) {
      logger.error('DOCUMENT', `Failed to delete blob for document ${documentId}`, error);
    }
  } else {
    logger.warn('DOCUMENT', `BLOB_READ_WRITE_TOKEN not set, skipping blob deletion for document ${documentId}`);
  }

  // Delete document — userId-scoped for defense-in-depth (cascades to chunks via FK)
  await db.delete(documents).where(and(eq(documents.id, documentId), eq(documents.user_id, userId)));

  logger.info('DOCUMENT', `Document deleted: ${documentId} for user: ${userId}`);
}
