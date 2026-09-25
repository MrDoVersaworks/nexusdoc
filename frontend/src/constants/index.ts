const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
if (process.env.NODE_ENV === 'production' && !configuredApiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL must be configured for production builds.');
}

export const API_BASE_URL = configuredApiUrl
  ? (typeof window !== 'undefined' && configuredApiUrl.includes('localhost')
      ? configuredApiUrl.replace('localhost', window.location.hostname)
      : configuredApiUrl)
  : (typeof window !== 'undefined' ? `http://${window.location.hostname}:4000` : 'http://localhost:4000');

export const ACCESS_TOKEN_KEY = 'nexusdoc_access_token';
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = '.pdf,.txt';
export const ACCEPTED_MIME_TYPES = ['application/pdf', 'text/plain'] as const;
export const DEFAULT_PAGE_SIZE = 10;
export const BREAKPOINTS = { MOBILE: 768, TABLET: 1024 } as const;
export const MAX_SUMMARY_DISPLAY_LENGTH = 150;
