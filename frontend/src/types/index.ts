// ============================================================
// API RESPONSE TYPES (mirrors backend exactly per Law 1)
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
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  user: AuthUser;
}

// ============================================================
// DOCUMENT TYPES
// ============================================================
export interface Document {
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
export interface AISettings {
  hasApiKey: boolean;
  geminiModel: string | null;
  geminiEmbeddingModel: string | null;
}
