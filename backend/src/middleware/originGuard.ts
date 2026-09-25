import type { NextFunction, Request, Response } from 'express';
import { allowedOrigins, config } from '../config';

export function isAllowedOrigin(origin: string | undefined): boolean {
  const normalized = origin?.trim().replace(/\/+$/, '');
  return Boolean(normalized && allowedOrigins.includes(normalized));
}

export function originGuard(req: Request, res: Response, next: NextFunction): void {
  if (isAllowedOrigin(req.headers.origin)) {
    next();
    return;
  }

  if (!req.headers.origin && config.NODE_ENV !== 'production') {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: { code: 'ERR_CSRF_ORIGIN', message: 'Request origin is not allowed.' },
  });
}
