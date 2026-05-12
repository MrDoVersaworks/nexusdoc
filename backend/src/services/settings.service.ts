import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { users } from '../db/schema';
import { encrypt, decrypt } from './encryption.service';
import { ErrorCode } from '../constants';
import { logger } from '../utils/logger';
import type { AISettingsResponse, EncryptedData } from '../types';

interface UpdateAISettingsInput {
  userId: string;
  geminiApiKey?: string;
  geminiModel: string;
  geminiEmbeddingModel: string;
}

interface AISettingsUpdateFields {
  gemini_model: string;
  gemini_embedding_model: string;
  encrypted_gemini_key?: string;
  gemini_key_iv?: string;
  gemini_key_tag?: string;
  updated_at: Date;
}

export async function getAISettings(userId: string): Promise<AISettingsResponse> {
  const userRows = await db
    .select({
      encrypted_gemini_key: users.encrypted_gemini_key,
      gemini_model: users.gemini_model,
      gemini_embedding_model: users.gemini_embedding_model,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRows.length === 0) {
    throw new Error(`[${ErrorCode.INTERNAL_ERROR}] User not found.`);
  }

  const user = userRows[0];

  return {
    hasApiKey: user.encrypted_gemini_key !== null,
    geminiModel: user.gemini_model,
    geminiEmbeddingModel: user.gemini_embedding_model,
  };
}

export async function updateAISettings(input: UpdateAISettingsInput): Promise<AISettingsResponse> {
  const updateData: AISettingsUpdateFields = {
    gemini_model: input.geminiModel,
    gemini_embedding_model: input.geminiEmbeddingModel,
    updated_at: new Date(),
  };

  // Only encrypt and store the API key if provided
  if (input.geminiApiKey) {
    const encrypted: EncryptedData = encrypt(input.geminiApiKey);
    updateData.encrypted_gemini_key = encrypted.encryptedText;
    updateData.gemini_key_iv = encrypted.iv;
    updateData.gemini_key_tag = encrypted.tag;
  }

  const updated = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, input.userId))
    .returning({
      encrypted_gemini_key: users.encrypted_gemini_key,
      gemini_model: users.gemini_model,
      gemini_embedding_model: users.gemini_embedding_model,
    });

  if (updated.length === 0) {
    throw new Error(`[${ErrorCode.SETTINGS_UPDATE_FAILED}] Failed to update AI settings.`);
  }

  logger.info('SETTINGS', `AI settings updated for user: ${input.userId}`);

  return {
    hasApiKey: updated[0].encrypted_gemini_key !== null,
    geminiModel: updated[0].gemini_model,
    geminiEmbeddingModel: updated[0].gemini_embedding_model,
  };
}

export async function deleteApiKey(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      encrypted_gemini_key: null,
      gemini_key_iv: null,
      gemini_key_tag: null,
      updated_at: new Date(),
    })
    .where(eq(users.id, userId));

  logger.info('SETTINGS', `API key deleted for user: ${userId}`);
}

export async function getDecryptedApiKey(userId: string): Promise<string> {
  const userRows = await db
    .select({
      encrypted_gemini_key: users.encrypted_gemini_key,
      gemini_key_iv: users.gemini_key_iv,
      gemini_key_tag: users.gemini_key_tag,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRows.length === 0) {
    throw new Error(`[${ErrorCode.INTERNAL_ERROR}] User not found.`);
  }

  const user = userRows[0];

  if (!user.encrypted_gemini_key || !user.gemini_key_iv || !user.gemini_key_tag) {
    throw new Error(`[${ErrorCode.AI_NO_API_KEY}] No Gemini API key configured. Please add your API key in Settings.`);
  }

  return decrypt({
    encryptedText: user.encrypted_gemini_key,
    iv: user.gemini_key_iv,
    tag: user.gemini_key_tag,
  });
}

export async function getUserModels(userId: string): Promise<{ geminiModel: string; geminiEmbeddingModel: string }> {
  const userRows = await db
    .select({
      gemini_model: users.gemini_model,
      gemini_embedding_model: users.gemini_embedding_model,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRows.length === 0) {
    throw new Error(`[${ErrorCode.INTERNAL_ERROR}] User not found.`);
  }

  const user = userRows[0];

  if (!user.gemini_model) {
    throw new Error(`[${ErrorCode.AI_NO_MODEL}] No Gemini generation model configured. Please set your model in Settings.`);
  }

  if (!user.gemini_embedding_model) {
    throw new Error(`[${ErrorCode.AI_NO_MODEL}] No Gemini embedding model configured. Please set your embedding model in Settings.`);
  }

  return {
    geminiModel: user.gemini_model,
    geminiEmbeddingModel: user.gemini_embedding_model,
  };
}
