// ============================================================
// API BASE URL
// ============================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');

// Dynamically resolve API URL for local network access (e.g. from mobile)
export const API_BASE_URL = typeof window !== 'undefined' 
  ? API_URL?.replace('localhost', window.location.hostname) || `http://${window.location.hostname}:4000`
  : API_URL || 'http://localhost:4000';

// ============================================================
// AUTH
// ============================================================
export const ACCESS_TOKEN_KEY = 'nexusdoc_access_token';

// ============================================================
// FILE CONSTRAINTS
// ============================================================
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = '.pdf,.txt';
export const ACCEPTED_MIME_TYPES = ['application/pdf', 'text/plain'];

// ============================================================
// PAGINATION
// ============================================================
export const DEFAULT_PAGE_SIZE = 10;

// ============================================================
// UI
// ============================================================
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

export const MAX_SUMMARY_DISPLAY_LENGTH = 150;
