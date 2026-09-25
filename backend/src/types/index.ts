import { z } from 'zod';

export interface ApiSuccessResponse<T> { success: true; data: T; }
export interface ApiErrorResponse { success: false; error: { code: string; message: string; }; }
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface PaginatedResponse<T> { success: true; data: T[]; pagination: PaginationMeta; }

export interface JwtAccessPayload {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
}
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface DocumentListItem {
  id: string;
  title: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
  download_path: string;
}
export interface DocumentDetail extends DocumentListItem {
  user_id: string;
  content_text: string;
}
export type DocumentResponse = DocumentDetail;

export interface SearchResult {
  chunk_text: string;
  chunk_index: number;
  similarity: number;
  document_id: string;
  document_title: string;
  document_filename: string;
}

export interface AISettingsResponse {
  hasApiKey: boolean;
  geminiModel: string | null;
  geminiEmbeddingModel: string | null;
}
export interface EncryptedData {
  encryptedText: string;
  iv: string;
  tag: string;
}

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must not exceed 128 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').trim(),
});
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion'),
});
export const documentUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters').trim(),
});
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Search query must not exceed 500 characters').trim(),
});
export const aiSettingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().min(1).max(100),
  geminiEmbeddingModel: z.string().min(1).max(100),
});
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['created_at', 'title', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export const uuidParamSchema = z.object({
  id: z.string().uuid('must be a valid UUID'),
});
export const publicReviewSchema = z.object({
  name: z.string().trim().min(1).max(255),
  profession: z.string().trim().max(255).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  feedback: z.string().trim().min(1).max(2000),
});
export const adminSettingsSchema = z.object({
  google_analytics_id: z.string().max(50).nullable().optional(),
  termly_uuid: z.string().max(50).nullable().optional(),
  privacy_policy_content: z.string().max(100_000).nullable().optional(),
  terms_of_service_content: z.string().max(100_000).nullable().optional(),
}).strict();

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      isAdmin?: boolean;
    }
  }
}
