import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { db } from '../db/connection';
import { users, refreshTokens, documents } from '../db/schema';
import { config } from '../config';
import { BCRYPT_SALT_ROUNDS, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY_DAYS, ErrorCode } from '../constants';
import { logger } from '../utils/logger';
import type { JwtAccessPayload, AuthenticatedUser } from '../types';

interface RegisterInput { email: string; password: string; name: string; }
interface LoginResult { accessToken: string; refreshToken: string; user: AuthenticatedUser; }
interface RegisterResult { user: AuthenticatedUser; }

function normalizeEmail(email: string): string { return email.trim().toLowerCase(); }
function hashRefreshToken(rawToken: string): string {
  return `sha256:${crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex')}`;
}
async function verifyRefreshToken(rawToken: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('sha256:')) {
    const expected = storedHash.slice('sha256:'.length);
    const actual = crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
    return expected.length === actual.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
  }
  return bcrypt.compare(rawToken, storedHash);
}
function makeAccessToken(user: { id: string; email: string; name: string; is_admin: boolean }): string {
  const payload: JwtAccessPayload = { userId: user.id, email: user.email, name: user.name, isAdmin: user.is_admin };
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}
function makeRefreshToken(): string { return crypto.randomBytes(40).toString('hex'); }
function refreshExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return expiresAt;
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw new Error(`[${ErrorCode.AUTH_EMAIL_EXISTS}] An account with this email already exists.`);
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
  const inserted = await db.insert(users).values({
    email, password_hash: passwordHash, name: input.name.trim(), is_admin: false,
  }).returning({ id: users.id, email: users.email, name: users.name, is_admin: users.is_admin });
  if (inserted.length === 0) throw new Error(`[${ErrorCode.INTERNAL_ERROR}] Failed to create user account.`);
  const user = inserted[0];
  return { user: { id: user.id, email: user.email, name: user.name, isAdmin: user.is_admin } };
}

export async function loginUser(inputEmail: string, password: string): Promise<LoginResult> {
  const email = normalizeEmail(inputEmail);
  const userRows = await db.select({
    id: users.id, email: users.email, name: users.name, password_hash: users.password_hash, is_admin: users.is_admin,
  }).from(users).where(eq(users.email, email)).limit(1);
  if (userRows.length === 0) throw new Error(`[${ErrorCode.AUTH_INVALID_CREDENTIALS}] Invalid email or password.`);
  const user = userRows[0];
  if (!(await bcrypt.compare(password, user.password_hash))) {
    throw new Error(`[${ErrorCode.AUTH_INVALID_CREDENTIALS}] Invalid email or password.`);
  }
  const accessToken = makeAccessToken(user);
  const rawRefreshToken = makeRefreshToken();
  const insertedTokens = await db.insert(refreshTokens).values({
    user_id: user.id, token_hash: hashRefreshToken(rawRefreshToken), expires_at: refreshExpiry(),
  }).returning({ id: refreshTokens.id });
  if (insertedTokens.length === 0) throw new Error(`[${ErrorCode.INTERNAL_ERROR}] Failed to create refresh token.`);
  return {
    accessToken, refreshToken: `${insertedTokens[0].id}.${rawRefreshToken}`,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.is_admin },
  };
}

export async function refreshAccessToken(refreshTokenValue: string): Promise<LoginResult> {
  const dotIndex = refreshTokenValue.indexOf('.');
  if (dotIndex === -1) throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] Invalid refresh token format.`);
  const tokenId = refreshTokenValue.substring(0, dotIndex);
  const rawToken = refreshTokenValue.substring(dotIndex + 1);
  const tokenRows = await db.select({
    id: refreshTokens.id, user_id: refreshTokens.user_id, token_hash: refreshTokens.token_hash, expires_at: refreshTokens.expires_at,
  }).from(refreshTokens).where(eq(refreshTokens.id, tokenId)).limit(1);
  if (tokenRows.length === 0) throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] Refresh token not found.`);
  const storedToken = tokenRows[0];
  if (new Date() > storedToken.expires_at || !(await verifyRefreshToken(rawToken, storedToken.token_hash))) {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenId));
    throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] Invalid or expired refresh token.`);
  }
  const userRows = await db.select({
    id: users.id, email: users.email, name: users.name, is_admin: users.is_admin,
  }).from(users).where(eq(users.id, storedToken.user_id)).limit(1);
  if (userRows.length === 0) throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] User not found.`);
  const user = userRows[0];
  const nextRawToken = makeRefreshToken();
  const rotated = await db.update(refreshTokens).set({
    token_hash: hashRefreshToken(nextRawToken), expires_at: refreshExpiry(), updated_at: new Date(),
  }).where(eq(refreshTokens.id, tokenId)).returning({ id: refreshTokens.id });
  if (rotated.length === 0) throw new Error(`[${ErrorCode.AUTH_REFRESH_FAILED}] Refresh token was already rotated.`);
  return {
    accessToken: makeAccessToken(user), refreshToken: `${tokenId}.${nextRawToken}`,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.is_admin },
  };
}

export async function logoutUser(refreshTokenValue: string): Promise<void> {
  const dotIndex = refreshTokenValue.indexOf('.');
  if (dotIndex === -1) return;
  const tokenId = refreshTokenValue.substring(0, dotIndex);
  await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenId));
  logger.info('AUTH', `Refresh token invalidated: ${tokenId}`);
}

export async function deleteUserAccount(userId: string, password: string): Promise<void> {
  const userRows = await db.select({ id: users.id, password_hash: users.password_hash })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (userRows.length === 0) throw new Error(`[${ErrorCode.AUTH_INVALID_CREDENTIALS}] User not found.`);
  if (!(await bcrypt.compare(password, userRows[0].password_hash))) {
    throw new Error(`[${ErrorCode.AUTH_PASSWORD_MISMATCH}] Incorrect password. Account deletion requires password confirmation.`);
  }
  const userDocs = await db.select({ file_url: documents.file_url }).from(documents).where(eq(documents.user_id, userId));
  if (config.BLOB_READ_WRITE_TOKEN) {
    for (const doc of userDocs) {
      try {
        await del(doc.file_url, { token: config.BLOB_READ_WRITE_TOKEN });
      } catch (blobError: unknown) {
        logger.error('AUTH', 'Failed to delete blob during account deletion; database deletion aborted.', blobError);
        throw new Error(`[${ErrorCode.INTERNAL_ERROR}] Account deletion could not complete because document storage cleanup failed. Please retry.`);
      }
    }
  } else if (userDocs.length > 0) {
    throw new Error(`[${ErrorCode.INTERNAL_ERROR}] Account deletion cannot complete because document storage is not configured.`);
  }
  await db.delete(users).where(eq(users.id, userId));
  logger.info('AUTH', `Account deleted for user: ${userId}. ${userDocs.length} document files cleaned up.`);
}
