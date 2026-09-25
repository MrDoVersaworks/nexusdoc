import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { ErrorCode, EMBEDDING_DIMENSION } from '../constants';

const AI_TIMEOUT_MS = 30_000;
const EMBEDDING_CONCURRENCY = 4;
const EMBEDDING_RETRIES = 2;

function providerErrorCode(error: unknown): ErrorCode {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (/(quota|rate limit|resource exhausted|too many requests|429)/i.test(message)) {
    return ErrorCode.AI_QUOTA_EXCEEDED;
  }
  if (/(api key|unauthenticated|unauthorized|permission denied|forbidden|401|403)/i.test(message)) {
    return ErrorCode.AI_AUTH_FAILED;
  }
  if (/(fetch failed|network|econn|enotfound|timeout|timed out|service unavailable|503|502|500)/i.test(message)) {
    return ErrorCode.AI_PROVIDER_UNAVAILABLE;
  }
  return ErrorCode.AI_PROCESSING_FAILED;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('AI provider timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function withRetry<T>(operation: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await withTimeout(operation(), AI_TIMEOUT_MS);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
  throw lastError;
}

export async function summarizeText(apiKey: string, modelName: string, text: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const maxChars = 30_000;
  const boundedText = text.substring(0, maxChars);
  const scopeNote = text.length > maxChars
    ? 'NOTE: The source document exceeded the current summary input budget. This summary is based only on the first 30,000 characters; it is not a whole-document summary.'
    : 'The complete extracted document is included below.';

  const prompt = `You are a document analysis assistant. Analyze the supplied document and provide a structured summary with:
1. Main Topic
2. Key Points
3. Key Entities
4. Conclusion/Takeaways

${scopeNote}

Document text:
---
${boundedText}
---
`;

  try {
    const result = await withRetry(() => model.generateContent(prompt), 2);
    const summary = result.response.text();
    if (!summary || summary.trim().length === 0) throw new Error(`[${ErrorCode.AI_SUMMARIZATION_FAILED}] Gemini returned an empty summary.`);
    return summary;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes(ErrorCode.AI_SUMMARIZATION_FAILED)) throw error;
    const code = providerErrorCode(error);
    logger.error('AI_SERVICE', `Summarization failed [${code}]`, error);
    throw new Error(`[${code}] AI summarization could not be completed.`);
  }
}

export async function generateEmbedding(apiKey: string, embeddingModelName: string, text: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: embeddingModelName });
  try {
    const result = await withRetry(() => model.embedContent(text), EMBEDDING_RETRIES);
    const embedding = result.embedding.values;
    if (!embedding || embedding.length === 0) throw new Error(`[${ErrorCode.AI_EMBEDDING_FAILED}] Gemini returned an empty embedding.`);
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`[${ErrorCode.AI_EMBEDDING_FAILED}] Embedding model returned ${embedding.length} dimensions; configured pgvector contract requires exactly ${EMBEDDING_DIMENSION}.`);
    }
    return embedding;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes(ErrorCode.AI_EMBEDDING_FAILED)) throw error;
    const code = providerErrorCode(error);
    logger.error('AI_SERVICE', `Embedding generation failed [${code}]`, error);
    throw new Error(`[${code}] AI embedding generation could not be completed.`);
  }
}

export async function generateEmbeddings(apiKey: string, embeddingModelName: string, texts: string[]): Promise<number[][]> {
  logger.info('AI_SERVICE', `Generating embeddings for ${texts.length} items with concurrency ${EMBEDDING_CONCURRENCY}...`);
  const results = new Array<number[]>(texts.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex++;
      if (index >= texts.length) return;
      results[index] = await generateEmbedding(apiKey, embeddingModelName, texts[index]);
    }
  }

  const workerCount = Math.min(EMBEDDING_CONCURRENCY, texts.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
