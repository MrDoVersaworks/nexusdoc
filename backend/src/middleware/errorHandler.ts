import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../constants';
import { logger } from '../utils/logger.js';
import type { ApiErrorResponse } from '../types';

const CLIENT_ERROR_MESSAGES: Record<string, { statusCode: number; message: string }> = {
  [ErrorCode.AI_NO_API_KEY]: {
    statusCode: 422,
    message: 'AI processing is not configured for this account. Add your Gemini API key in Settings and try again.',
  },
  [ErrorCode.AI_NO_MODEL]: {
    statusCode: 422,
    message: 'AI processing is not configured for this account. Choose a Gemini generation and embedding model in Settings and try again.',
  },
  [ErrorCode.AI_QUOTA_EXCEEDED]: {
    statusCode: 429,
    message: 'Your Gemini AI service has reached its usage limit. Check your API quota or billing settings, then try again.',
  },
  [ErrorCode.AI_AUTH_FAILED]: {
    statusCode: 422,
    message: 'Your Gemini API key was rejected. Check or replace the API key in Settings, then try again.',
  },
  [ErrorCode.AI_PROVIDER_UNAVAILABLE]: {
    statusCode: 503,
    message: 'The Gemini AI service is temporarily unavailable. Your document was not completed. Please try again shortly.',
  },
  [ErrorCode.AI_SUMMARIZATION_FAILED]: {
    statusCode: 502,
    message: 'AI summarization could not be completed. Check your Gemini configuration and try again.',
  },
  [ErrorCode.AI_EMBEDDING_FAILED]: {
    statusCode: 502,
    message: 'AI document indexing could not be completed. Check your Gemini configuration and try again.',
  },
  [ErrorCode.AI_PROCESSING_FAILED]: {
    statusCode: 502,
    message: 'AI processing could not be completed. Check your Gemini configuration and try again.',
  },
};

export function getClientErrorDetails(code: string): { statusCode: number; message: string } | undefined {
  return CLIENT_ERROR_MESSAGES[code];
}

function errorCodeFromMessage(message: string): string | null {
  const match = message.match(/^\[([A-Z0-9_]+)\]/);
  return match?.[1] ?? null;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  constructor(message: string, statusCode: number, code: string = ErrorCode.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('GLOBAL_ERROR_HANDLER', err.message, err);

  if (err instanceof AppError) {
    const response: ApiErrorResponse = { success: false, error: { code: err.code, message: err.message } };
    res.status(err.statusCode).json(response);
    return;
  }

  const parsedCode = errorCodeFromMessage(err.message);
  const mapped = parsedCode ? CLIENT_ERROR_MESSAGES[parsedCode] : undefined;
  if (mapped) {
    const response: ApiErrorResponse = { success: false, error: { code: parsedCode!, message: mapped.message } };
    res.status(mapped.statusCode).json(response);
    return;
  }

  const response: ApiErrorResponse = {
    success: false,
    error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred. Please try again later.' },
  };
  res.status(500).json(response);
}
