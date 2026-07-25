import { rateLimit } from 'express-rate-limit';
import { AUTH_RATE_LIMIT_WINDOW_MS, AUTH_RATE_LIMIT_MAX_REQUESTS, API_RATE_LIMIT_WINDOW_MS, API_RATE_LIMIT_MAX_REQUESTS, ErrorCode } from '../constants';
import type { ApiErrorResponse } from '../types';

export const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.RATE_LIMITED,
        message: 'Too many requests. Please try again later.',
      },
    };
    res.status(429).json(response);
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW_MS,
  max: API_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.RATE_LIMITED,
        message: 'API rate limit exceeded. Please try again in a minute.',
      },
    };
    res.status(429).json(response);
  },
});
