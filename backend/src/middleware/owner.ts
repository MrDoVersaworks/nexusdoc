import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';

export function ownerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authenticatedEmail = req.userEmail?.trim();
  const adminEmail = config.ADMIN_EMAIL?.trim();

  if (!authenticatedEmail) {
    res.status(401).json({
      success: false,
      error: {
        code: 'ERR_ADMIN_IDENTITY_MISSING',
        message: 'Authenticated owner identity is required.',
      },
    });
    return;
  }

  if (!adminEmail || authenticatedEmail.toLowerCase() !== adminEmail.toLowerCase()) {
    res.status(403).json({
      success: false,
      error: {
        code: 'ERR_ADMIN_FORBIDDEN',
        message: 'Owner authorization is required.',
      },
    });
    return;
  }

  next();
}
