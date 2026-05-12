import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { ErrorCode, EMBEDDING_DIMENSION } from '../constants';

export async function summarizeText(
  apiKey: string,
  modelName: string,
  text: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `You are a document analysis assistant. Analyze the following document and provide a comprehensive summary that includes:

1. **Main Topic**: What is this document about?
2. **Key Points**: The most important points or findings (bullet points)
3. **Key Entities**: Important names, organizations, dates, or figures mentioned
4. **Conclusion/Takeaways**: The main conclusions or actionable takeaways

Document text:
---
${text.substring(0, 30000)}
---

Provide the summary in a clear, structured format.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();

    if (!summary || summary.trim().length === 0) {
      throw new Error(`[${ErrorCode.AI_SUMMARIZATION_FAILED}] Gemini returned an empty summary.`);
    }

    return summary;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes(ErrorCode.AI_SUMMARIZATION_FAILED)) {
      throw error;
    }
    logger.error('AI_SERVICE', 'Summarization failed', error);
    throw new Error(`[${ErrorCode.AI_SUMMARIZATION_FAILED}] Failed to generate document summary. Please check your API key and model configuration.`);
  }
}

export async function generateEmbedding(
  apiKey: string,
  embeddingModelName: string,
  text: string
): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: embeddingModelName });

  try {
    const result = await model.embedContent(text);
    let embedding = result.embedding.values;

    if (!embedding || embedding.length === 0) {
      throw new Error(`[${ErrorCode.AI_EMBEDDING_FAILED}] Gemini returned an empty embedding.`);
    }

    // Adaptive Dimension Normalizer
    if (embedding.length > EMBEDDING_DIMENSION) {
      // Truncate (Matryoshka Representation Learning fallback)
      embedding = embedding.slice(0, EMBEDDING_DIMENSION);
      logger.info('AI_SERVICE', `Truncated embedding from ${result.embedding.values.length} to ${EMBEDDING_DIMENSION} dimensions.`);
    } else if (embedding.length < EMBEDDING_DIMENSION) {
      // Pad with zeroes
      const padded = new Array(EMBEDDING_DIMENSION).fill(0);
      for (let i = 0; i < embedding.length; i++) {
        padded[i] = embedding[i];
      }
      embedding = padded;
      logger.info('AI_SERVICE', `Padded embedding from ${result.embedding.values.length} to ${EMBEDDING_DIMENSION} dimensions.`);
    }

    return embedding;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes(ErrorCode.AI_EMBEDDING_FAILED)) {
      throw error;
    }
    logger.error('AI_SERVICE', 'Embedding generation failed', error);
    throw new Error(`[${ErrorCode.AI_EMBEDDING_FAILED}] Failed to generate embedding. Please check your API key and embedding model configuration.`);
  }
}

export async function generateEmbeddings(
  apiKey: string,
  embeddingModelName: string,
  texts: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(apiKey, embeddingModelName, text);
    embeddings.push(embedding);
  }

  return embeddings;
}
