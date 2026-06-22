import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../constants';
import { logger } from '../utils/logger.js';
import type { ApiErrorResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}


export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('GLOBAL_ERROR_HANDLER', err.message, err);

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred. Please try again later.',
    },
  };

  res.status(500).json(response);
}
