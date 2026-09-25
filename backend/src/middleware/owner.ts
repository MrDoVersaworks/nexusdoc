import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';

export async function ownerMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ success: false, error: { code: 'ERR_ADMIN_IDENTITY_MISSING', message: 'Authenticated owner identity is required.' } });
    return;
  }

  const rows = await db.select({ is_admin: users.is_admin }).from(users).where(eq(users.id, req.userId)).limit(1);
  if (rows.length === 0) {
    res.status(401).json({ success: false, error: { code: 'ERR_ADMIN_IDENTITY_MISSING', message: 'Authenticated owner identity is required.' } });
    return;
  }

  if (!rows[0].is_admin) {
    res.status(403).json({ success: false, error: { code: 'ERR_ADMIN_FORBIDDEN', message: 'Owner authorization is required.' } });
    return;
  }

  req.isAdmin = true;
  next();
}
