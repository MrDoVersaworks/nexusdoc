import { Request, Response, NextFunction } from 'express';
import { ErrorCode, CLIENT_ERROR_MESSAGES } from '../constants';
import { logger } from '../utils/logger.js';
import type { ApiErrorResponse } from '../types';

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
