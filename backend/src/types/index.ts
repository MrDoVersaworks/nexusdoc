import { z } from 'zod';

// ============================================================
// API RESPONSE TYPES
// ============================================================
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================
// AUTH TYPES
// ============================================================
export interface JwtAccessPayload {
  userId: string;
  email: string;
  name: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

// ============================================================
// DOCUMENT TYPES
// ============================================================
export interface DocumentResponse {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  content_text: string;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  chunk_text: string;
  chunk_index: number;
  similarity: number;
  document_id: string;
  document_title: string;
  document_filename: string;
}

// ============================================================
// SETTINGS TYPES
// ============================================================
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

// ============================================================
// ZOD VALIDATION SCHEMAS
// ============================================================
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion'),
});

export const documentUploadSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters')
    .trim(),
});

export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query must not exceed 500 characters')
    .trim(),
});

export const aiSettingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  geminiModel: z
    .string()
    .min(1, 'Generation model name is required')
    .max(100, 'Model name must not exceed 100 characters'),
  geminiEmbeddingModel: z
    .string()
    .min(1, 'Embedding model name is required')
    .max(100, 'Model name must not exceed 100 characters'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['created_at', 'title', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================
// EXPRESS REQUEST EXTENSION
// ============================================================
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}
