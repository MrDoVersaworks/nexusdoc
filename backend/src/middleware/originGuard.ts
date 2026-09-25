import type { NextFunction, Request, Response } from 'express';
import { allowedOrigins, config } from '../config';

export function originGuard(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin?.trim().replace(/\/+$/, '');
  if (origin && allowedOrigins.includes(origin)) {
    next();
    return;
  }

  if (!origin && config.NODE_ENV !== 'production') {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: { code: 'ERR_CSRF_ORIGIN', message: 'Request origin is not allowed.' },
  });
}
