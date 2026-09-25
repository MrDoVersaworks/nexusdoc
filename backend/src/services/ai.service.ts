import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { ErrorCode, EMBEDDING_DIMENSION } from '../constants';
import { AppError } from '../middleware/errorHandler';

const AI_TIMEOUT_MS = 30_000;
const EMBEDDING_CONCURRENCY = 4;
const EMBEDDING_RETRIES = 2;

function providerStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

function providerMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isQuotaError(error: unknown): boolean {
  const status = providerStatus(error);
  const message = providerMessage(error).toLowerCase();
  return status === 429 || message.includes('quota') || message.includes('rate limit') || message.includes('too many requests');
}

function isAuthError(error: unknown): boolean {
  const status = providerStatus(error);
  const message = providerMessage(error).toLowerCase();
  return status === 401 || status === 403 || message.includes('api key') && (message.includes('invalid') || message.includes('unauthorized') || message.includes('forbidden'));
}

function isTransientProviderError(error: unknown): boolean {
  const message = providerMessage(error).toLowerCase();
  return message.includes('fetch failed') || message.includes('timeout') || message.includes('timed out') || message.includes('temporarily unavailable') || message.includes('503');
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
      if (attempt < attempts && !isQuotaError(error) && !isAuthError(error)) {
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

function throwClassifiedAIError(operation: 'summary' | 'embedding', error: unknown): never {
  if (isQuotaError(error)) {
    throw new AppError(
      'Your AI provider has reached its usage limit. Check your Gemini API quota or billing settings, then try again.',
      429,
      ErrorCode.AI_QUOTA_EXCEEDED,
    );
  }

  if (isAuthError(error)) {
    throw new AppError(
      'Your Gemini API key was rejected. Update the API key in Settings and try again.',
      400,
      ErrorCode.AI_AUTH_FAILED,
    );
  }

  if (isTransientProviderError(error)) {
    throw new AppError(
      'The AI provider is temporarily unavailable. Your document was not completed. Please try again shortly.',
      503,
      ErrorCode.AI_PROVIDER_UNAVAILABLE,
    );
  }

  const message = operation === 'embedding'
    ? 'AI embedding could not be generated. Check your AI model configuration and try again.'
    : 'AI summary could not be generated. Check your AI model configuration and try again.';

  throw new AppError(message, 502, operation === 'embedding' ? ErrorCode.AI_EMBEDDING_FAILED : ErrorCode.AI_SUMMARIZATION_FAILED);
}

export async function summarizeText(apiKey: string, modelName: string, text: string): Promise<string> {
  if (!apiKey) {
    throw new AppError('No Gemini API key is configured for this account. Add an API key in Settings and try again.', 400, ErrorCode.AI_NO_API_KEY);
  }
  if (!modelName) {
    throw new AppError('No AI summary model is configured for this account. Select an AI model in Settings and try again.', 400, ErrorCode.AI_NO_MODEL);
  }

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
    if (!summary || summary.trim().length === 0) {
      throw new AppError('The AI provider returned an empty summary. Please try again.', 502, ErrorCode.AI_SUMMARIZATION_FAILED);
    }
    return summary;
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error('AI_SERVICE', 'Summarization failed', error);
    throwClassifiedAIError('summary', error);
  }
}

export async function generateEmbedding(apiKey: string, embeddingModelName: string, text: string): Promise<number[]> {
  if (!apiKey) {
    throw new AppError('No Gemini API key is configured for this account. Add an API key in Settings and try again.', 400, ErrorCode.AI_NO_API_KEY);
  }
  if (!embeddingModelName) {
    throw new AppError('No AI embedding model is configured for this account. Select an embedding model in Settings and try again.', 400, ErrorCode.AI_NO_MODEL);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: embeddingModelName });
  try {
    const result = await withRetry(() => model.embedContent(text), EMBEDDING_RETRIES);
    const embedding = result.embedding.values;
    if (!embedding || embedding.length === 0) {
      throw new AppError('The AI provider returned an empty embedding. Please try again.', 502, ErrorCode.AI_EMBEDDING_FAILED);
    }
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new AppError(
        `The configured embedding model returned an incompatible vector size. Select the supported embedding model in Settings and try again.`,
        400,
        ErrorCode.AI_EMBEDDING_FAILED,
      );
    }
    return embedding;
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error('AI_SERVICE', 'Embedding generation failed', error);
    throwClassifiedAIError('embedding', error);
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
