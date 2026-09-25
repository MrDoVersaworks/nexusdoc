// ============================================================
// FILE SIZE LIMITS
// ============================================================
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE_DISPLAY = '10MB';

// ============================================================
// ACCEPTED FILE TYPES
// ============================================================
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
] as const;

export const ACCEPTED_EXTENSIONS = ['.pdf', '.txt'] as const;

// ============================================================
// TEXT CHUNKING
// ============================================================
export const CHUNK_SIZE_TOKENS = 500;
export const CHUNK_OVERLAP_TOKENS = 50;

// ============================================================
// PAGINATION DEFAULTS
// ============================================================
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

// ============================================================
// SEARCH
// ============================================================
export const SEARCH_TOP_K = 10;
export const SEARCH_SIMILARITY_THRESHOLD = 0.3;

// ============================================================
// AUTH
// ============================================================
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const BCRYPT_SALT_ROUNDS = 12;
export const REFRESH_COOKIE_NAME = 'nexusdoc_refresh_token';

// ============================================================
// RATE LIMITING
// ============================================================
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_RATE_LIMIT_MAX_REQUESTS = 20;
export const API_RATE_LIMIT_WINDOW_MS = 1 * 60 * 1000;
export const API_RATE_LIMIT_MAX_REQUESTS = 60;
export const CONTACT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const CONTACT_RATE_LIMIT_MAX_REQUESTS = 5;

// ============================================================
// EMBEDDING
// ============================================================
export const EMBEDDING_DIMENSION = 768;

// ============================================================
// ERROR CODES
// ============================================================
export enum ErrorCode {
  AUTH_EMAIL_EXISTS = 'ERR_AUTH_EMAIL_EXISTS',
  AUTH_INVALID_CREDENTIALS = 'ERR_AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'ERR_AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'ERR_AUTH_TOKEN_INVALID',
  AUTH_NO_TOKEN = 'ERR_AUTH_NO_TOKEN',
  AUTH_REFRESH_FAILED = 'ERR_AUTH_REFRESH_FAILED',
  AUTH_PASSWORD_MISMATCH = 'ERR_AUTH_PASSWORD_MISMATCH',

  DOC_NOT_FOUND = 'ERR_DOC_NOT_FOUND',
  DOC_INVALID_TYPE = 'ERR_DOC_INVALID_TYPE',
  DOC_TOO_LARGE = 'ERR_DOC_TOO_LARGE',
  DOC_UPLOAD_FAILED = 'ERR_DOC_UPLOAD_FAILED',
  DOC_TEXT_EXTRACTION_FAILED = 'ERR_DOC_TEXT_EXTRACTION_FAILED',
  DOC_NO_FILE = 'ERR_DOC_NO_FILE',

  AI_NO_API_KEY = 'ERR_AI_NO_API_KEY',
  AI_NO_MODEL = 'ERR_AI_NO_MODEL',
  AI_SUMMARIZATION_FAILED = 'ERR_AI_SUMMARIZATION_FAILED',
  AI_EMBEDDING_FAILED = 'ERR_AI_EMBEDDING_FAILED',
  AI_QUOTA_EXCEEDED = 'ERR_AI_QUOTA_EXCEEDED',
  AI_AUTH_FAILED = 'ERR_AI_AUTH_FAILED',
  AI_PROVIDER_UNAVAILABLE = 'ERR_AI_PROVIDER_UNAVAILABLE',
  AI_PROCESSING_FAILED = 'ERR_AI_PROCESSING_FAILED',

  SETTINGS_UPDATE_FAILED = 'ERR_SETTINGS_UPDATE_FAILED',

  VALIDATION_FAILED = 'ERR_VALIDATION_FAILED',
  INTERNAL_ERROR = 'ERR_INTERNAL_ERROR',
  NOT_FOUND = 'ERR_NOT_FOUND',
  RATE_LIMITED = 'ERR_RATE_LIMITED',
}


export const CLIENT_ERROR_MESSAGES: Record<string, { statusCode: number; message: string }> = {
  [ErrorCode.AI_NO_API_KEY]: { statusCode: 422, message: 'AI processing is not configured for this account. Add your Gemini API key in Settings and try again.' },
  [ErrorCode.AI_NO_MODEL]: { statusCode: 422, message: 'AI processing is not configured for this account. Choose a Gemini generation and embedding model in Settings and try again.' },
  [ErrorCode.AI_QUOTA_EXCEEDED]: { statusCode: 429, message: 'Your Gemini AI service has reached its usage limit. Check your API quota or billing settings, then try again.' },
  [ErrorCode.AI_AUTH_FAILED]: { statusCode: 422, message: 'Your Gemini API key was rejected. Check or replace the API key in Settings, then try again.' },
  [ErrorCode.AI_PROVIDER_UNAVAILABLE]: { statusCode: 503, message: 'The Gemini AI service is temporarily unavailable. Your document was not completed. Please try again shortly.' },
  [ErrorCode.AI_SUMMARIZATION_FAILED]: { statusCode: 502, message: 'AI summarization could not be completed. Check your Gemini configuration and try again.' },
  [ErrorCode.AI_EMBEDDING_FAILED]: { statusCode: 502, message: 'AI document indexing could not be completed. Check your Gemini configuration and try again.' },
  [ErrorCode.AI_PROCESSING_FAILED]: { statusCode: 502, message: 'AI processing could not be completed. Check your Gemini configuration and try again.' },
};
