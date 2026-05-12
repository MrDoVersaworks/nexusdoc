import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { db } from '../db/connection';
import { users, refreshTokens, documents } from '../db/schema';
import { config } from '../config';
import {
  BCRYPT_SALT_ROUNDS,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
  ErrorCode,
} from '../constants';
import { logger } from '../utils/logger';
import type {
  JwtAccessPayload,
  AuthenticatedUser,
} from '../types';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

interface RegisterResult {
  user: AuthenticatedUser;
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`[${ErrorCode.AUTH_EMAIL_EXISTS}] An account with this email already exists.`);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const inserted = await db
    .insert(users)
    .values({
      email: input.email,
      password_hash: passwordHash,
      name: input.name,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  if (inserted.length === 0) {
    throw new Error(`[${ErrorCode.INTERNAL_ERROR}] Failed to create user account.`);
  }

  return { user: inserted[0] };
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      password_hash: users.password_hash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userRows.length === 0) {
    throw new Error(`[${ErrorCode.AUTH_INVALID_CREDENTIALS}] Invalid email or password.`);
  }

  const user = userRows[0];
  const passwordValid = await bcrypt.compare(password, user.password_hash);

  if (!passwordValid) {
    throw new Error(`[${ErrorCode.AUTH_INVALID_CREDENTIALS}] Invalid email or password.`);
  }

  // Generate access token
  const accessPayload: JwtAccessPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
  const accessToken = jwt.sign(accessPayload, config.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  // Generate refresh token
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = await bcrypt.hash(rawRefreshToken, BCRYPT_SALT_ROUNDS);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  const insertedTokens = await db
    .insert(refreshTokens)
    .values({
      user_id: user.id,
      token_hash: refreshTokenHash,
      expires_at: expiresAt,
    })
    .returning({ id: refreshTokens.id });

  if (insertedTokens.length === 0) {
    throw new Error(`[${ErrorCode.INTERNAL_ERROR}] Failed to create refresh token.`);
  }

  // Encode the token ID into the refresh token so we can look it up later
  const refreshToken = `${insertedTokens[0].id}.${rawRefreshToken}`;

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function refreshAccessToken(refreshTokenValue: string): Promise<string> {
  const dotIndex = refreshTokenValue.indexOf('.');
  if (dotIndex === -1) {
    throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] Invalid refresh token format.`);
  }

  const tokenId = refreshTokenValue.substring(0, dotIndex);
  const rawToken = refreshTokenValue.substring(dotIndex + 1);

  const tokenRows = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.id, tokenId))
    .limit(1);

  if (tokenRows.length === 0) {
    throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] Refresh token not found.`);
  }

  const storedToken = tokenRows[0];

  // Check expiry
  if (new Date() > storedToken.expires_at) {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenId));
    throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] Refresh token has expired.`);
  }

  // Verify hash
  const isValid = await bcrypt.compare(rawToken, storedToken.token_hash);
  if (!isValid) {
    throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] Invalid refresh token.`);
  }

  // Get user
  const userRows = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, storedToken.user_id))
    .limit(1);

  if (userRows.length === 0) {
    throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] User not found.`);
  }

  const user = userRows[0];
  const accessPayload: JwtAccessPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(accessPayload, config.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export async function logoutUser(refreshTokenValue: string): Promise<void> {
  const dotIndex = refreshTokenValue.indexOf('.');
  if (dotIndex === -1) {
    return; // No valid token to invalidate
  }

  const tokenId = refreshTokenValue.substring(0, dotIndex);
  await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenId));
  logger.info('AUTH', `Refresh token invalidated: ${tokenId}`);
}

export async function deleteUserAccount(userId: string, password: string): Promise<void> {
  // Verify password
  const userRows = await db
    .select({ id: users.id, password_hash: users.password_hash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRows.length === 0) {
    throw new Error(`[${ErrorCode.AUTH_INVALID_CREDENTIALS}] User not found.`);
  }

  const user = userRows[0];
  const passwordValid = await bcrypt.compare(password, user.password_hash);

  if (!passwordValid) {
    throw new Error(`[${ErrorCode.AUTH_PASSWORD_MISMATCH}] Incorrect password. Account deletion requires password confirmation.`);
  }

  // Cascade delete: chunks → documents → refresh tokens → user
  // ON DELETE CASCADE handles DB records, but Vercel Blob files must be cleaned up explicitly
  const userDocs = await db
    .select({ file_url: documents.file_url })
    .from(documents)
    .where(eq(documents.user_id, userId));

  // Delete all user files from Vercel Blob storage
  if (config.BLOB_READ_WRITE_TOKEN) {
    for (const doc of userDocs) {
      try {
        await del(doc.file_url, { token: config.BLOB_READ_WRITE_TOKEN });
      } catch (blobError: unknown) {
        logger.error('AUTH', `Failed to delete blob file: ${doc.file_url}`, blobError);
      }
    }
  } else {
    logger.warn('AUTH', `BLOB_READ_WRITE_TOKEN not set, skipping blob cleanup for ${userDocs.length} files`);
  }

  // Delete user — cascades to refresh_tokens, documents, document_chunks
  await db.delete(users).where(eq(users.id, userId));

  logger.info('AUTH', `Account deleted for user: ${userId}. ${userDocs.length} document files cleaned up.`);
}
