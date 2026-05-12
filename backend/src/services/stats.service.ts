import { db } from '../db/connection';
import { documents, documentChunks, users } from '../db/schema';
import { count, eq, sql } from 'drizzle-orm';

export class StatsService {
  static async getUserStats(userId: string) {
    // 1. Count Documents
    const [docCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.user_id, userId));

    // 2. Count Summaries (Documents where ai_summary is not null)
    const [summaryCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(
        sql`${documents.user_id} = ${userId} AND ${documents.ai_summary} IS NOT NULL`
      );

    // 3. Count Searches (We'll count chunks since that represents semantic search capacity)
    const [chunkCount] = await db
      .select({ count: count() })
      .from(documentChunks)
      .where(eq(documentChunks.user_id, userId));

    // 4. API Key Status
    const [user] = await db
      .select({ hasKey: sql<boolean>`${users.encrypted_gemini_key} IS NOT NULL` })
      .from(users)
      .where(eq(users.id, userId));

    return {
      documents: docCount.count,
      summaries: summaryCount.count,
      chunks: chunkCount.count,
      hasApiKey: user?.hasKey || false,
    };
  }
}
