import { sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { SEARCH_TOP_K, SEARCH_SIMILARITY_THRESHOLD } from '../constants';
import { generateEmbedding } from './ai.service';
import { getDecryptedApiKey, getUserModels } from './settings.service';
import { logger } from '../utils/logger';
import type { SearchResult } from '../types';

interface SearchRow {
  chunk_text: string;
  chunk_index: number;
  similarity: number;
  document_id: string;
  document_title: string;
  document_filename: string;
}

function isSearchRow(row: unknown): row is SearchRow {
  if (typeof row !== 'object' || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.chunk_text === 'string' &&
    typeof r.chunk_index === 'number' &&
    typeof r.document_id === 'string' &&
    typeof r.document_title === 'string' &&
    typeof r.document_filename === 'string' &&
    (typeof r.similarity === 'number' || typeof r.similarity === 'string')
  );
}

export async function semanticSearch(userId: string, query: string): Promise<SearchResult[]> {
  // Get user's API key and embedding model
  const apiKey = await getDecryptedApiKey(userId);
  const models = await getUserModels(userId);

  // Generate embedding for the search query
  const queryEmbedding = await generateEmbedding(apiKey, models.geminiEmbeddingModel, query);
  const vectorLiteral = `[${queryEmbedding.join(',')}]`;

  // pgvector cosine similarity search — Drizzle sql tag provides parameterization
  const results = await db.execute(
    sql`SELECT
          dc.chunk_text,
          dc.chunk_index,
          1 - (dc.embedding <=> ${vectorLiteral}::vector) AS similarity,
          dc.document_id,
          d.title AS document_title,
          d.original_filename AS document_filename
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.user_id = ${userId}
          AND 1 - (dc.embedding <=> ${vectorLiteral}::vector) > ${SEARCH_SIMILARITY_THRESHOLD}
        ORDER BY dc.embedding <=> ${vectorLiteral}::vector ASC
        LIMIT ${SEARCH_TOP_K}`
  );

  const rows = results.rows;

  if (!Array.isArray(rows)) {
    throw new Error('[ERR_INTERNAL_ERROR] Unexpected search result format from database.');
  }

  const validatedRows: SearchResult[] = [];
  for (const row of rows) {
    if (!isSearchRow(row)) {
      logger.error('SEARCH', `Invalid row shape returned from pgvector query: ${JSON.stringify(row)}`);
      continue;
    }
    validatedRows.push({
      chunk_text: row.chunk_text,
      chunk_index: row.chunk_index,
      similarity: Number(row.similarity),
      document_id: row.document_id,
      document_title: row.document_title,
      document_filename: row.document_filename,
    });
  }

  logger.info('SEARCH', `Search for user ${userId}: "${query}" returned ${validatedRows.length} results`);

  return validatedRows;
}
