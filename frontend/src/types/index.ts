export interface ApiSuccessResponse<T> { success: true; data: T; }
export interface ApiErrorResponse { success: false; error: { code: string; message: string; }; }
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta { page: number; limit: number; total: number; totalPages: number; }
export interface PaginatedResponse<T> { success: true; data: T[]; pagination: PaginationMeta; }

export interface AuthUser { id: string; email: string; name: string; isAdmin: boolean; }
export interface LoginResponse { accessToken: string; user: AuthUser; refreshToken?: string; }
export interface RegisterResponse { user: AuthUser; }

export interface DocumentListItem {
  id: string; title: string; original_filename: string; file_type: string; file_size_bytes: number;
  ai_summary: string | null; created_at: string; updated_at: string; download_path: string;
}
export interface DocumentDetail extends DocumentListItem {
  user_id: string; content_text: string;
}
export type Document = DocumentDetail;

export interface SearchResult {
  chunk_text: string; chunk_index: number; similarity: number; document_id: string; document_title: string; document_filename: string;
}
export interface AISettings { hasApiKey: boolean; geminiModel: string | null; geminiEmbeddingModel: string | null; }
